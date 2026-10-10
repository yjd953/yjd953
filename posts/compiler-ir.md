# 编译器为什么需要 IR？

C、Go、Rust 的语法、类型系统和运行时差别很大；x86-64、ARM64、RISC-V 的寄存器和指令编码也不同。

如果每种语言都直接为每种 CPU 写一套完整编译器，工程关系会变成：

```text
C    → x86 / ARM / RISC-V
Go   → x86 / ARM / RISC-V
Rust → x86 / ARM / RISC-V
```

语言数量为 N、目标架构数量为 M，直接组合接近 N × M。IR，Intermediate Representation，中间表示，在中间建立了一层可分析、可变换的语言，使前端和后端不必理解彼此所有细节。

## AST 已经是中间结构，为什么还不够

源代码：

```c
int f(int a, int b) {
    int x = a + b;
    return x * 2;
}
```

Parser 构造 AST：

```text
FunctionDecl f
├─ Parameters a, b
└─ Body
   ├─ VarDecl x
   │  └─ Add(a, b)
   └─ Return
      └─ Multiply(x, 2)
```

AST 很适合保存源语言结构。错误信息需要知道变量声明、语句、泛型和源码位置。

但 CPU 不执行“变量声明”和“Return 节点”。优化器也更关心：

- 值从哪里定义；
- 哪些操作有副作用；
- 控制流从哪个基本块到哪个基本块；
- 某个值在哪些路径上可达；
- 内存读写是否可能指向同一位置。

所以编译器会继续把 AST Lower 到更规整的 IR。

## IR 把语法差异压成共同操作

三种语言可能写：

```c
// C
x = a + b;
```

```go
// Go
x := a + b
```

```rust
// Rust
let x = a + b;
```

通过类型检查后，它们都可以表示为近似：

```text
x = add_i32(a, b)
```

这不表示三种语言语义完全相同。溢出、别名、生命周期、异常、GC 和 Undefined Behavior 仍需在 Lowering 时编码为不同约束或操作。

IR 的价值是把已经解释清楚的高级语义，转换成后续优化能够统一处理的形式。

## 为什么常用 SSA

Static Single Assignment 要求每个值只定义一次。

普通形式：

```text
x = 1
x = x + a
x = x * b
```

SSA 形式：

```text
x0 = 1
x1 = add(x0, a0)
x2 = mul(x1, b0)
```

数据依赖立刻可见：`x2` 依赖 `x1`，`x1` 依赖 `x0` 和 `a0`。

遇到分支：

```c
if (cond) {
    x = 1;
} else {
    x = 2;
}
return x + 3;
```

SSA 使用 Phi 概念合并控制流：

```text
then:
  x1 = 1
  goto join

else:
  x2 = 2
  goto join

join:
  x3 = phi(x1 from then, x2 from else)
  y0 = add(x3, 3)
  return y0
```

优化器无需猜测 `x` 当前是哪次赋值，Def-Use Chain 已经显式建立。

## IR 让优化成为可复用 Pass

有了统一 IR，可以编写独立优化 Pass。

### Constant Folding

```text
x = add_i32(20, 22)
```

变成：

```text
x = 42
```

### Dead Code Elimination

```text
x = expensive_compute()
return 1
```

若 `expensive_compute` 无副作用且 `x` 未使用，可以删除。

### Common Subexpression Elimination

```text
x = add(a, b)
y = add(a, b)
```

在条件允许时复用第一次结果。

### Loop Invariant Code Motion

```text
for each i:
    t = width * height
    out[i] = in[i] * t
```

若 `width`、`height` 在循环中不变，把乘法移到循环外。

这些优化若直接作用于 C AST、Go AST 和 Rust AST，需要重复理解每种语法。作用于统一 IR 后，核心算法可复用。

## IR 也让分析成为可能

优化不是文本替换，它必须证明变换不改变程序语义。

常见分析包括：

- Control Flow Graph；
- Dominator Tree；
- Liveness Analysis；
- Alias Analysis；
- Escape Analysis；
- Range Analysis；
- Call Graph。

例如删除数组边界检查，需要证明索引一定落在合法范围。若 IR 能表达：

```text
0 <= i < len(slice)
```

Range Analysis 才可能给出证明。

IR 不只是“另一种汇编”，它还承载优化所需的事实与约束。

## 为什么不只设计一种万能 IR

离源语言越近，越容易保留高级语义；离机器越近，越容易做硬件相关优化。单一 IR 很难同时做好两端。

现代编译器通常使用多层 IR：

```text
Source
→ AST / HIR
→ Typed IR
→ Control-flow / SSA IR
→ Machine IR
→ Assembly / Machine Code
```

### High-level IR

保留：

- 泛型；
- 所有权；
- 闭包；
- 异步结构；
- 语言级类型。

适合做语言专属检查与变换。

### Mid-level IR

把语法降低为控制流、显式值和内存操作，适合通用优化。

### Low-level / Machine IR

接近目标指令，已经考虑：

- 目标寄存器类；
- 指令合法形式；
- 调用约定；
- CPU Feature；
- 指令延迟与吞吐。

适合 Instruction Selection、Register Allocation 和 Scheduling。

“IR”不是一个固定文件格式，而是编译器不同阶段内部语言的总称。

## C、Go、Rust 实际如何使用 IR

### C / Clang / LLVM

典型链路：

```text
C Source
→ Clang AST
→ LLVM IR
→ Target-specific Machine IR
→ Assembly
```

LLVM IR 近似类型化 SSA：

```llvm
define i32 @add(i32 %a, i32 %b) {
entry:
  %sum = add i32 %a, %b
  ret i32 %sum
}
```

### Rust

Rust 编译器需要先处理宏、类型、Trait 和所有权，再生成 MIR：

```text
Rust Source
→ AST / HIR
→ THIR / MIR
→ LLVM IR（常见后端）
→ Machine Code
```

Borrow Checker 等语言语义不应等到低层机器 IR 才处理，因为那时所有权结构已经丢失。

### Go

Go 官方编译器不依赖 LLVM 作为默认后端，它有自己的内部 IR 与 SSA 后端：

```text
Go Source
→ Syntax / Typed IR
→ SSA
→ Architecture-specific operations
→ Machine Code
```

这说明“需要 IR”不等于“必须使用 LLVM”。LLVM 是一套流行基础设施，IR 是更普遍的编译器设计思想。

## IR 如何解耦语言与 CPU

假设编译器前端把不同语言都降低到一套中层操作：

```text
add_i64
load
store
branch
call
```

前端负责：

```text
源语言语法与类型
→ 正确的 IR 语义
```

后端负责：

```text
IR 操作
→ 某个 CPU 的合法高效指令
```

新增一门语言时，可以复用已有后端；新增一个 CPU 后端时，可以服务多个前端。实际工程并非完美 N+M，因为语言 Runtime 和架构特性仍有交叉，但耦合大幅降低。

## 解耦不等于抹平差异

考虑整数溢出：

- 某些 C 有符号溢出属于 Undefined Behavior；
- Rust Debug 构建常检查溢出，Release 行为依配置；
- Go 整数运算有明确的二进制结果规则。

如果前端都粗暴生成同一个 `add`，优化器可能错误改变语义。IR 需要表达：

```text
普通环绕加法
带溢出检查的加法
假设不溢出的加法
饱和加法
```

再如内存：

- Rust 的借用信息可帮助别名分析；
- Go 需要 GC 指针信息和 Write Barrier；
- C 的指针规则影响优化边界。

好的 Lowering 不是丢掉一切高级语义，而是把后续阶段仍需依赖的语义编码下来。

## IR 到机器码还差什么

通用 IR 可能允许无限数量的虚拟值：

```text
v1, v2, v3, ... v1000
```

真实 CPU 只有有限寄存器。Register Allocator 必须决定：

- 哪些值留在寄存器；
- 哪些值 Spill 到栈；
- 哪些寄存器需要跨函数保存。

IR 的 `add_i64` 也不必一一对应单条机器指令。后端可能选择：

- x86 的某种 `ADD` 或 `LEA`；
- ARM64 的 `ADD`；
- 向量指令；
- 多条指令组合。

目标 CPU 的指令集、微架构成本模型和 ABI 在这一阶段进入决策。

## IR 也是正确性边界

每次 Lowering 都需要保持语义：

```text
Source semantics
  ≡ High-level IR
  ≡ Optimized IR
  ≡ Machine IR
  ≡ Machine Code observable behavior
```

编译器 Bug 常发生在某个 Pass 错误证明了等价性。测试方法包括：

- 单元测试某个 IR Pass；
- Differential Testing；
- Fuzzing；
- 比较优化前后执行结果；
- Formal Verification。

IR 使这些阶段可检查。如果所有逻辑从 AST 一步直达机器码，中间变换会更难观察和验证。

## 用工具看见 IR

C / Clang：

```bash
clang -S -emit-llvm add.c -o add.ll
clang -O2 -S -emit-llvm add.c -o add.opt.ll
```

Rust 可通过编译器选项观察 MIR，但部分选项依赖 Nightly：

```bash
rustc +nightly -Z unpretty=mir app.rs
```

Go 可以查看 SSA 调试输出或最终汇编；具体环境变量与调试选项随 Go 版本变化，最稳定的入口仍是：

```bash
go build -gcflags='-S' .
go tool objdump ./app
```

观察时重点不是记住打印格式，而是比较：

- 高级变量何时变成 SSA 值；
- 分支何时变成 Basic Block；
- 常量和无用代码在哪一层消失；
- 架构寄存器何时出现。

## IR 的真正价值

IR 同时建立了三种边界：

```text
语言边界：
  复杂语法 → 明确操作与控制流

优化边界：
  在可分析结构上证明并执行等价变换

硬件边界：
  通用操作 → 目标架构指令与寄存器
```

所以编译器需要 IR，不只是为了支持更多 CPU，也不只是为了做优化。它把“理解源语言”和“驾驭目标机器”拆成可以独立演进、反复验证的阶段。

程序最终仍会变成机器码，但在变成机器码之前，IR 给编译器提供了一个最重要的工作空间：既比源代码规则，又还没有被某一颗 CPU 的细节锁死。
