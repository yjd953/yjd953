# 一行 Go 代码是怎么变成 CPU 指令的？

从这行开始：

```go
a += b
```

它在 Go 语义中表示读取 `a` 和 `b`，执行与类型相匹配的加法，再把结果赋回 `a`。CPU 不认识变量名和 `+=`，编译器必须逐层把它降为目标架构的机器指令。

## 先给代码一个完整上下文

```go
package main

func add(a, b int64) int64 {
    a += b
    return a
}

func main() {
    println(add(40, 2))
}
```

单独观察 `a += b` 时，很容易忽略上下文会改变结果：

- `a`、`b` 是 `int64` 还是 `float64`；
- 它们在寄存器、栈还是 Heap 对象里；
- 函数是否被 Inline；
- 参数是不是编译期常量；
- 目标是 amd64 还是 arm64；
- 是否开启优化。

所以“一行 Go 对应哪条汇编”没有永恒唯一答案。编译器只需保证可观察行为符合 Go 规范。

## 第 1 层：Source Code 只是字节

编译器最初读到的是 UTF-8 文件内容：

```text
61 20 2b 3d 20 62
 a     +  =     b
```

词法分析器把字符归类成 Token：

```text
IDENT("a")
ADD_ASSIGN("+=")
IDENT("b")
```

空格通常不再重要，标识符和操作符类别则被保留。词法阶段不知道 `a` 是整数，也不知道它是否已声明。

## 第 2 层：Parser 构造 AST

Parser 根据 Go 语法，把 Token 组合成 Abstract Syntax Tree。

概念上：

```text
AssignStmt
├─ Op: +=
├─ Left:  Ident("a")
└─ Right: Ident("b")
```

AST 保留源语言结构：这是赋值语句，左边是可写位置，右边是表达式。它比原始文本更适合后续分析，却仍然没有决定具体 CPU 指令。

如果写成：

```go
a +=
```

Parser 就能在这一层发现语法不完整。它不需要等到生成机器码才报错。

## 第 3 层：名称解析与类型检查赋予语义

编译器查找 `a` 和 `b` 分别绑定到哪个声明，并确定类型。

对于：

```go
func add(a, b int64) int64
```

它得到：

```text
a: int64
b: int64
+: signed 64-bit integer addition
result assigned back to a
```

这一层会拒绝：

```go
var a int64
var b string
a += b
```

因为不存在把 `string` 加到 `int64` 的合法运算。

类型还决定溢出行为。普通无符号整数按模运算；有符号整数运算也使用二进制补码结果，不会像某些语言那样自动抛出溢出异常。

## 第 4 层：编译器内部 IR 消除表面语法

`a += b` 是语法糖，语义接近：

```go
a = a + b
```

编译器会把复杂 AST 降低为更接近执行的内部表示。概念上可能变成：

```text
t0 = Add64(a, b)
a  = t0
Return(a)
```

Go 编译器实际拥有多层内部结构，并会将函数转换到 SSA，Static Single Assignment，形式。SSA 要求每个值定义一次：

```text
a0 = Arg<0>
b0 = Arg<1>
a1 = Add64(a0, b0)
Return(a1)
```

源码中的“修改变量 a”，在 SSA 中变成创建新值 `a1`。这让数据依赖显式化，优化器更容易判断一个值来自哪里、被谁使用。

## 第 5 层：优化可能让源码消失

在 `main` 中：

```go
println(add(40, 2))
```

编译器可能 Inline `add`，再做常量传播：

```text
40 + 2 → 42
```

最终 `a += b` 不一定对应任何运行时加法。CPU 可能直接获得常量 42。

为了观察真实加法，可以阻止内联：

```go
//go:noinline
func add(a, b int64) int64 {
    a += b
    return a
}
```

优化阶段还可能做：

- Dead Code Elimination；
- Bounds Check Elimination；
- Copy Propagation；
- Common Subexpression Elimination；
- Loop 优化；
- Escape Analysis 驱动的栈或 Heap 放置。

编译器的任务不是逐行翻译，而是在保持语义的前提下生成更好的程序。

## 第 6 层：从通用 SSA 到架构相关操作

SSA 中的 `Add64` 仍是抽象操作。后端根据目标架构选择指令。

在 amd64 上，它可能选择 64 位整数加法；在 arm64 上选择另一种编码：

```text
通用 IR：Add64(a, b)

amd64 → ADDQ
arm64 → ADD
```

这一步通常被称为 Instruction Selection。随后还要做：

- 寄存器分配；
- Spill 决策；
- 指令调度；
- 栈帧布局；
- Prologue / Epilogue 生成；
- GC Stack Map 生成。

Go 程序还需要 Runtime 能识别哪些栈位置保存指针，以便 Garbage Collector 在 Safepoint 扫描。编译器输出的不只是 CPU 指令，还包括类型、栈图、重定位和调试元数据。

## 第 7 层：Go Assembly

执行：

```bash
go build -gcflags='-S' .
```

或者：

```bash
go tool compile -S main.go
```

在某个 Go 版本的 amd64 内部 ABI 下，`add` 可能接近：

```asm
TEXT main.add(SB), NOSPLIT|NOFRAME|ABIInternal
    ADDQ BX, AX
    RET
```

Go Assembly 使用 Plan 9 风格语法，操作数方向与 Intel 风格不同。这里可理解为：

```text
AX = AX + BX
return AX
```

参数 `a`、`b` 被调用约定放入寄存器 `AX`、`BX`，返回值仍使用 `AX`。不同 Go 版本、架构和 ABI 可能使用不同位置，不要把示例寄存器当成语言规范。

如果 `a` 是结构体字段：

```go
p.a += b
```

汇编还需要：

```text
计算 p.a 的地址
→ 从内存读取
→ 加 b
→ 写回内存
```

如果多个 Goroutine 并发访问，它也不会自动原子。普通 `+=` 是读、改、写组合，需要锁或 `sync/atomic` 才能建立并发安全语义。

## 第 8 层：Assembler 把助记符编码成机器码

Go Assembler 将：

```asm
ADDQ BX, AX
RET
```

编码成目标 ISA 的字节，并输出目标文件。目标文件中不仅有代码，还包括：

- 符号；
- 重定位项；
- 只读数据；
- Go 类型和 GC 元数据；
- 调试信息。

机器码字节的具体值取决于指令形式和寄存器编码。可以让工具给出事实：

```bash
go tool objdump -s 'main\.add' ./app
```

输出会同时显示地址、源代码行、机器字节和汇编指令。不要靠手工背编码判断实际二进制。

## 第 9 层：Linker 拼成可执行文件

一个函数的目标代码还不是完整程序。Linker 需要：

- 合并各 Package 的目标代码；
- 解析函数和全局符号；
- 处理重定位；
- 删除不可达代码；
- 布局 Text、Data、BSS 等段；
- 加入 Go Runtime；
- 写出 ELF、Mach-O 或 PE 可执行文件。

Go 常见构建会把大量 Runtime 代码链接进二进制。程序启动后，真正进入 `main.main` 之前，Runtime 已建立调度器、内存管理、GC 和初始 Goroutine 所需环境。

因此 Go 的 `main` 同样不是操作系统直接调用的第一段代码。

## 第 10 层：Loader 把机器码映射进进程

执行 `./app` 后，操作系统读取可执行文件头，建立虚拟地址空间，将代码段映射为可执行页面。

CPU 的指令指针最终到达 `main.add` 的机器码地址。假设：

```text
AX = 40
BX = 2
```

CPU 对 `ADDQ BX, AX` 的架构效果是：

```text
读取 AX
读取 BX
执行 64 位加法
结果 42 写回 AX
更新相关状态标志
前进到下一条指令
```

`RET` 再根据调用约定恢复返回地址，回到调用者。

CPU 不知道这是 Go，也不知道 `a` 曾经是一个源代码变量。Go 语义已经被压缩进机器指令、内存布局和 Runtime 约定。

## 一行代码经历的完整链路

```text
Go Source
  a += b
    ↓ Lexer / Parser
AST
  Add-Assign(a, b)
    ↓ Name Resolution / Type Check
Typed operation
  signed int64 addition
    ↓ Lowering
IR / SSA
  a1 = Add64(a0, b0)
    ↓ Optimization
optimized SSA
    ↓ Instruction Selection
architecture-specific operations
    ↓ Register Allocation
AX / BX assignment
    ↓ Assembly
ADDQ BX, AX
    ↓ Assembler
Machine Code bytes
    ↓ Linker / Loader
Executable memory page
    ↓ CPU
register state transition
```

## 用编译器自己回答

可以用这组命令观察：

```bash
go build -gcflags='-S -N -l' -o app .
go tool objdump -s 'main\.add' ./app
go build -gcflags='-m=2' .
```

其中：

- `-S` 输出汇编；
- `-N` 关闭多数优化；
- `-l` 关闭内联；
- `-m=2` 展示内联与 Escape Analysis 决策。

再去掉 `-N -l` 比较，会看到优化如何改变甚至消除源码结构。

## 编译不是逐字翻译

`a += b` 从来不是被机械替换成固定指令。它先获得类型和作用域语义，再被降低为数据流，经过优化、指令选择与寄存器分配，最终成为某种架构上的状态变化。

真正稳定的不是某条汇编，而是每一层维护的契约：

```text
Go 规范定义源码语义
IR 保存可优化的数据依赖
后端遵循目标 ISA
ABI 约定参数与返回值位置
操作系统映射可执行文件
CPU 实现机器指令效果
```

一行高级语言能跨越这些层，是因为每一层都隐藏了下一层的复杂性，同时保留了上一层要求的可观察结果。
