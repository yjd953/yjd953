# 后端开发八股文指南

> 面向后端开发岗位招聘面试的系统知识点梳理，覆盖 **Java 基础、JVM、并发多线程、Go 基础、Redis、MySQL、消息队列、计算机网络、分布式系统** 九大核心模块，共 **90 个高频面试知识点**。

## 📖 使用说明

- **结构**：每个知识点包含「面试问题 → 原理解答 → 深度追问 → 代码示例 → 常见误区 → 版本说明」六个部分
- **阅读方式**：建议按模块顺序系统学习，也可通过下方目录快速定位薄弱环节
- **版本标注**：涉及版本差异的结论均注明适用版本（如 Java 8/17、Go 1.18+、Redis 6.x/7.x、MySQL 5.7/8.0、Kafka 3.x 等）
- **代码示例**：所有代码片段均为关键代码，配有注释说明
- **持续更新**：本文档将持续补充新的考点和技术演进内容

---

## 📚 目录

- [一、Java 基础](#一java-基础)
  - [1. HashMap 底层原理](#1-hashmap-底层原理)
  - [2. ArrayList vs LinkedList](#2-arraylist-vs-linkedlist)
  - [3. String 不可变性](#3-string-不可变性)
  - [4. 接口 vs 抽象类](#4-接口-vs-抽象类)
  - [5. 异常体系](#5-异常体系)
  - [6. 泛型与类型擦除](#6-泛型与类型擦除)
  - [7. 注解与反射](#7-注解与反射)
  - [8. Java 8+ 新特性](#8-java-8-新特性)
  - [9. equals() 与 hashCode() 契约](#9-equals-与-hashcode-契约)
  - [10. 值传递还是引用传递](#10-值传递还是引用传递)
- [二、JVM](#二jvm)
  - [1. JVM 内存区域划分](#1-jvm-内存区域划分)
  - [2. 垃圾标记算法](#2-垃圾标记算法)
  - [3. 垃圾收集算法](#3-垃圾收集算法)
  - [4. 经典垃圾收集器](#4-经典垃圾收集器)
  - [5. 类加载机制](#5-类加载机制)
  - [6. JVM 调优与排查工具](#6-jvm-调优与排查工具)
  - [7. 方法区 / 元空间变迁](#7-方法区-元空间变迁)
  - [8. 对象创建与内存布局](#8-对象创建与内存布局)
  - [9. Java 内存模型 JMM](#9-java-内存模型-jmm)
  - [10. Full GC 触发条件与避免](#10-full-gc-触发条件与避免)
- [三、并发与多线程](#三并发与多线程)
  - [1. synchronized 底层原理](#1-synchronized-底层原理)
  - [2. volatile 关键字](#2-volatile-关键字)
  - [3. AQS 原理](#3-aqs-原理)
  - [4. ReentrantLock vs synchronized](#4-reentrantlock-vs-synchronized)
  - [5. 线程池](#5-线程池)
  - [6. ThreadLocal](#6-threadlocal)
  - [7. CAS 与原子类](#7-cas-与原子类)
  - [8. 并发容器](#8-并发容器)
  - [9. 死锁](#9-死锁)
  - [10. CountDownLatch / CyclicBarrier / Semaphore](#10-countdownlatch-cyclicbarrier-semaphore)
- [四、Go 基础](#四go-基础)
  - [1. GMP 调度模型](#1-gmp-调度模型)
  - [2. Channel 底层原理](#2-channel-底层原理)
  - [3. 内存逃逸分析](#3-内存逃逸分析)
  - [4. GC 垃圾回收](#4-gc-垃圾回收)
  - [5. 并发安全与 sync 包](#5-并发安全与-sync-包)
  - [6. defer 机制](#6-defer-机制)
  - [7. slice 底层原理](#7-slice-底层原理)
  - [8. map 底层原理](#8-map-底层原理)
  - [9. interface 与类型断言](#9-interface-与类型断言)
  - [10. context 原理](#10-context-原理)
- [五、Redis](#五redis)
  - [1. 数据结构与底层实现](#1-数据结构与底层实现)
  - [2. 持久化机制](#2-持久化机制)
  - [3. 过期删除策略与内存淘汰](#3-过期删除策略与内存淘汰)
  - [4. 缓存三大问题](#4-缓存三大问题)
  - [5. 主从复制与哨兵](#5-主从复制与哨兵)
  - [6. Redis Cluster](#6-redis-cluster)
  - [7. 事务与 Lua](#7-事务与-lua)
  - [8. 分布式锁](#8-分布式锁)
  - [9. 单线程模型](#9-单线程模型)
  - [10. 大 Key 与热 Key](#10-大-key-与热-key)
- [六、MySQL](#六mysql)
  - [1. InnoDB 存储引擎架构](#1-innodb-存储引擎架构)
  - [2. 索引底层原理](#2-索引底层原理)
  - [3. 事务隔离级别与 MVCC](#3-事务隔离级别与-mvcc)
  - [4. 锁机制](#4-锁机制)
  - [5. redo log 与 undo log / binlog](#5-redo-log-与-undo-log-binlog)
  - [6. SQL 优化](#6-sql-优化)
  - [7. 主从复制](#7-主从复制)
  - [8. 分库分表](#8-分库分表)
  - [9. MVCC 实现细节](#9-mvcc-实现细节)
  - [10. MySQL 8.0 新特性](#10-mysql-80-新特性)
- [七、消息队列 MQ](#七消息队列-mq)
  - [1. MQ 的作用与主流产品选型](#1-mq-的作用与主流产品选型)
  - [2. 如何保证消息不丢失](#2-如何保证消息不丢失)
  - [3. 如何保证消息顺序性](#3-如何保证消息顺序性)
  - [4. 消息重复消费与幂等性](#4-消息重复消费与幂等性)
  - [5. 消息积压处理](#5-消息积压处理)
  - [6. Kafka 架构与高吞吐设计](#6-kafka-架构与高吞吐设计)
  - [7. Kafka 消费者组与 Rebalance](#7-kafka-消费者组与-rebalance)
  - [8. RocketMQ 架构：NameServer、事务消息、延迟消息](#8-rocketmq-架构nameserver事务消息延迟消息)
  - [9. 死信队列与重试机制](#9-死信队列与重试机制)
  - [10. MQ 推拉模式：Push vs Pull](#10-mq-推拉模式push-vs-pull)
- [八、计算机网络](#八计算机网络)
  - [1. TCP 三次握手与四次挥手](#1-tcp-三次握手与四次挥手)
  - [2. TCP 可靠传输机制](#2-tcp-可靠传输机制)
  - [3. TCP 拥塞控制](#3-tcp-拥塞控制)
  - [4. HTTP/1.1 vs HTTP/2 vs HTTP/3](#4-http11-vs-http2-vs-http3)
  - [5. HTTPS 与 TLS](#5-https-与-tls)
  - [6. DNS 解析过程](#6-dns-解析过程)
  - [7. Cookie / Session / Token / JWT](#7-cookie-session-token-jwt)
  - [8. 输入 URL 到页面显示全过程](#8-输入-url-到页面显示全过程)
  - [9. WebSocket 与 SSE](#9-websocket-与-sse)
  - [10. 跨域与 CORS](#10-跨域与-cors)
- [九、分布式系统](#九分布式系统)
  - [1. CAP 定理与 BASE 理论](#1-cap-定理与-base-理论)
  - [2. 分布式事务](#2-分布式事务)
  - [3. Raft 一致性算法](#3-raft-一致性算法)
  - [4. 分布式 ID 方案](#4-分布式-id-方案)
  - [5. 分布式锁](#5-分布式锁)
  - [6. 服务注册与发现](#6-服务注册与发现)
  - [7. 限流算法](#7-限流算法)
  - [8. 熔断降级](#8-熔断降级)
  - [9. 一致性哈希](#9-一致性哈希)
  - [10. 微服务网关](#10-微服务网关)

---

## 一、Java 基础
### 1. HashMap 底层原理

**Q：请讲讲 HashMap 的底层实现，1.7 和 1.8 有什么区别？扩容过程是怎样的？为什么会出现 1.7 并发扩容死循环？**

**解答：**

HashMap 是 Java 中最常用的 Map 实现，其底层是**数组 + 链表**（Java 1.7），Java 1.8 起演进为**数组 + 链表 + 红黑树**。

**数据结构：**

- **table 数组**：类型为 `Node<K,V>[]`，初始容量默认为 16（必须是 2 的幂）。每个位置称为"桶（bucket）"。
- **链表**：当多个 key 哈希到同一个桶（hash 碰撞）时，以链表形式挂在桶上。
- **红黑树**：Java 1.8 引入。当链表长度 ≥ 8 且数组长度 ≥ 64 时，链表转红黑树；当树节点数 ≤ 6 时退化为链表。树化是为了把最坏查询复杂度从 O(n) 降到 O(log n)。

**put 流程（1.8）：**

1. 对 key 的 `hashCode()` 做高 16 位异或低 16 位的扰动（`(h = key.hashCode()) ^ (h >>> 16)`），让高位也参与路由，减少碰撞。
2. 用 `(n - 1) & hash` 定位桶下标（容量是 2 的幂，等价于取模但更快）。
3. 桶为空直接插入；否则遍历链表/树，key 相等则覆盖 value，否则尾插新节点。
4. 插入后 `++size > threshold` 触发扩容，容量翻倍。

**扩容机制：**

- 阈值 `threshold = capacity * loadFactor`（默认 0.75）。
- 扩容时容量翻倍（`newCap = oldCap << 1`），由于容量始终是 2 的幂，元素要么留在原下标，要么移动到 `原下标 + 旧容量` 的位置——只需判断 hash 新增的那一位是 0 还是 1，无需重新计算完整 hash。

**1.7 vs 1.8 关键区别：**

| 维度 | 1.7 | 1.8 |
|---|---|---|
| 结构 | 数组 + 链表 | 数组 + 链表 + 红黑树 |
| 插入方式 | 头插法 | 尾插法 |
| 扩容重哈希 | 重新计算 index | 位运算快速定位 |
| 死循环 | 并发扩容会成环 | 不会成环（仍非线程安全） |

**1.7 并发扩容死循环：**

1.7 使用头插法，多线程同时 transfer 时，链表的指针会被反复翻转。假设两个线程同时扩容，线程 A 在 `e.next = newTab[i]` 处被挂起，线程 B 完成迁移后链表已反转，A 恢复后继续按反转后的链表重排，两个节点互相指向，形成环形链表。此后 get 命中该桶就会 CPU 100%。

**追问：**
- 追问1：为什么负载因子是 0.75？ → 0.75 是空间成本和查询成本的折中。过小（如 0.5）空间浪费、扩容频繁；过大（如 1.0）碰撞增多、链表变长。0.75 泊松分布下桶命中概率约 0.5，树化阈值 8 在概率上几乎不会触发。
- 追问2：为什么树化要求链表长度 ≥ 8 而不是 6？ → 理想随机 hash 下，桶内节点数遵循泊松分布，长度达到 8 的概率约为千万分之六。如果 hash 分布良好，红黑树几乎不会用到；否则说明 hash 函数有问题，树化也只是兜底。退化阈值设为 6 是为了避免在 7 附近反复树化/退化抖动。
- 追问3：HashMap 为什么容量必须是 2 的幂？ → 这样 `(n-1) & hash` 等价于 `hash % n`，且扩容时元素新位置可通过一位 bit 判断。如果不是 2 的幂，取模运算慢且扩容定位逻辑复杂。

**代码示例：**

```java
// JDK 1.8 HashMap 关键扰动函数
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}

// 桶下标计算：n 必须是 2 的幂
int index = (n - 1) & hash;

// 扩容时元素新位置判断
if ((oldCapMantissaBit & hash) == 0) {
    // 留在原下标
} else {
    // 移动到 原下标 + oldCap
}
```

**常见误区：**
- 误以为 1.8 的 HashMap 是线程安全的——只是没有了死循环，并发下仍可能丢数据（两个线程同时 put 到空桶互相覆盖）。线程安全请用 `ConcurrentHashMap`。
- 以为链表长度到 8 立刻树化——还要求数组长度 ≥ 64，否则优先扩容。
- 以为 HashMap 允许 null key/null value——允许，但只能有一个 null key。

**版本说明：** 以上为 Java 8 及之后的实现。Java 7 及之前无红黑树、头插法、存在并发死循环。

---

### 2. ArrayList vs LinkedList

**Q：ArrayList 和 LinkedList 的底层实现有什么区别？如何选择？**

**解答：**

**ArrayList** 底层是**动态数组**（`transient Object[] elementData`），支持随机访问。默认初始容量 10（首次 add 时才扩容为 10，注意是懒初始化），扩容时增长 1.5 倍（`oldCap + oldCap >> 1`）。

**LinkedList** 底层是**双向链表**（每个节点 `Node<E>` 包含 `prev`、`item`、`next`），同时实现了 `List` 和 `Deque` 接口，可以当队列/栈用。

**复杂度对比：**

| 操作 | ArrayList | LinkedList |
|---|---|---|
| get(i) | O(1) | O(n)（需从头/尾遍历） |
| add 末尾 | 均摊 O(1)（扩容时 O(n)） | O(1) |
| add 中间 | O(n)（数组搬移） | O(1)（找到位置后） |
| remove(i) | O(n)（搬移） | O(n) 查找 + O(1) 删除 |
| 内存 | 连续数组，有预留空间 | 每节点额外 prev/next 指针开销 |

**选择依据：**

- 以**随机访问、遍历**为主 → ArrayList。CPU 缓存局部性好，数组连续内存命中率高。
- 在**头尾频繁增删** → 两者都行，但 ArrayDeque 比 LinkedList 更适合做队列。
- 在**中间频繁增删**且能拿到迭代器 → LinkedList 理论上有优势，但实际中 LinkedList 的节点非连续、缓存不友好，且"拿到迭代器"本身就是 O(n) 查找，工程中 ArrayList 配合 `Arrays.copyOf` 往往更快。

**追问：**
- 追问1：ArrayList 扩容具体怎么实现？ → `Arrays.copyOf(elementData, newCapacity)` 把旧数组复制到新数组。由于数组是连续内存，这一步是整块拷贝。
- 追问2：ArrayList 为什么用 transient 修饰 elementData？ → 因为数组可能有大量预留空位，直接序列化浪费空间。ArrayList 自己实现了 `writeObject`/`readObject`，只序列化实际有元素的部分。
- 追问3：LinkedList 真的比 ArrayList 插入快吗？ → 不一定。在中间插入 LinkedList 要先 O(n) 找到位置，再 O(1) 修改指针；ArrayList 是 O(n) 搬移。但 ArrayList 的搬移是 `System.arraycopy`（native，连续内存），而 LinkedList 的遍历是节点指针跳跃，缓存未命中严重。实际 benchmark 中 ArrayList 经常更快。

**代码示例：**

```java
// ArrayList 扩容核心
private void grow(int minCapacity) {
    int oldCap = elementData.length;
    int newCap = oldCap + (oldCap >> 1); // 1.5 倍
    elementData = Arrays.copyOf(elementData, newCap);
}

// LinkedList 节点
private static class Node<E> {
    E item;
    Node<E> next;
    Node<E> prev;
}
```

**常见误区：**
- 以为 LinkedList 插入删除总是 O(1)——那是在已经拿到目标节点引用时；通过 index 定位仍是 O(n)。
- 以为 ArrayList 随机访问快是因为"数组"——本质是连续内存 + O(1) 寻址 + CPU 缓存预取。

**版本说明：** Java 6+ 行为一致。Java 7 开始 ArrayList 改为懒初始化（首次 add 才分配数组）。

---

### 3. String 不可变性

**Q：String 为什么不可变？什么是字符串常量池？intern() 方法的作用是什么？StringBuilder 和 StringBuffer 区别？**

**解答：**

**不可变性的含义：** String 对象一旦创建，其内容（字符数组 value）不能被修改。Java 9 之前底层是 `char[]`，Java 9 起改为 `byte[]` + 编码标志（Compact Strings）。所有"修改"String 的操作（substring、concat、replace）都返回新对象。

**为什么设计为不可变：**

1. **安全**：作为参数传递时不用担心被篡改。例如类加载器中以 String 作为类名，如果可变可能被替换。
2. **线程安全**：不可变对象天然线程安全，可自由共享。
3. **hashCode 缓存**：String 作为 HashMap key 时 hashCode 可以缓存，避免每次重算。
4. **常量池共享**：不可变才能安全地把字面量放入常量池复用。

**字符串常量池（String Pool）：**

- 位置：Java 7 之前在方法区（永久代），Java 7 移到堆中，Java 8 随永久代移除仍在堆中。
- 字面量 `String s = "abc"` 会先查常量池，存在则直接引用，不存在则创建并放入。
- `new String("abc")` 会创建两个对象：常量池中的 "abc"（如果不存在）和堆中的新 String 对象。

**intern()：**

- `s.intern()` 会去常量池查找是否有 equal 的字符串，有则返回池中的引用；没有则把当前 String 的引用放入池并返回。
- Java 7+ 后，intern 若池中没有，存的是堆中该 String 的引用（不再复制一份到永久代），节省空间。

**StringBuilder vs StringBuffer：**

- StringBuilder 非线程安全，方法无 synchronized，性能更好，是单线程拼接的首选。
- StringBuffer 方法加了 synchronized，线程安全但性能差。
- 循环中用 `+` 拼接字符串，编译器会优化为 StringBuilder append，但每次循环都 new 一个 StringBuilder，反而慢，应手动用一个 StringBuilder。

**追问：**
- 追问1：String s = new String("abc") 创建了几个对象？ → 若常量池没有 "abc"，创建 2 个（池中的 "abc" + 堆中的 String 实例）；若已有，只创建 1 个堆对象。
- 追问2：String s1 = new String("1"); s1.intern(); String s2 = "1"; s1 == s2? → Java 6 中 false（intern 复制到永久代），Java 7+ 中 true（intern 记录堆引用）。
- 追问3：String 为什么是 final 的？ → 防止子类破坏不可变性。如果可继承，子类可以覆盖方法让自己可变。

**代码示例：**

```java
String a = "hi";
String b = "hi";
System.out.println(a == b); // true，常量池复用

String c = new String("hi");
System.out.println(a == c); // false

String d = c.intern();
System.out.println(a == d); // true（Java 7+）

// 错误示范：循环中用 +
String s = "";
for (int i = 0; i < 1000; i++) {
    s += i; // 每次 new StringBuilder，性能差
}
// 正确：
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) sb.append(i);
```

**常见误区：**
- 以为 `String s = "a" + "b"` 会创建多个对象——编译器常量折叠，等价于 "ab"。
- 以为 intern 总是把字符串复制到常量池——Java 7+ 存的是堆引用。
- 以为 String 不可变是因为 value 是 final——value 是 final 引用，但 char[] 内容本身可变，只是 String 没暴露任何修改方法且类是 final。

**版本说明：** Java 7 字符串常量池移到堆；Java 9 Compact Strings（byte[] 替代 char[]）。

---

### 4. 接口 vs 抽象类

**Q：接口和抽象类有什么区别？Java 8 之后接口有什么变化？如何选择？**

**解答：**

**抽象类：**

- 用 `abstract class` 修饰，不能实例化。
- 可以有构造器、成员变量、普通方法、抽象方法、静态方法、final 方法。
- 一个类只能继承一个抽象类（单继承）。
- 体现"is-a"关系，是模板。

**接口：**

- 用 `interface` 修饰，Java 8 之前只能有 public 抽象方法和 public static final 常量。
- 一个类可以实现多个接口。
- 体现"can-do"能力，是契约。

**Java 8 接口变化：**

1. **默认方法（default method）**：接口可以有带默认实现的方法，解决接口演进问题（如 Collection 新增 stream() 不用破坏所有实现类）。
2. **静态方法**：接口里可以有静态方法。
3. **私有方法**（Java 9+）：接口里可以有 private 方法，供 default 方法复用。

**设计取舍：**

- 需要**代码复用、有状态、有构造器、有非公共方法** → 抽象类。
- 定义**能力契约、跨类型层次、多实现** → 接口。
- 接口多继承时如果多个父接口有同名 default 方法，实现类必须重写该方法，否则编译报错。

**追问：**
- 追问1：抽象类能有构造器吗？ → 能，供子类 super() 调用，不能自己 new。
- 追问2：接口能继承接口吗？ → 能，`interface A extends B, C` 多继承。
- 追问3：default 方法解决什么历史问题？ → Java 8 给 Collection 加了 stream()、forEach()，如果这些是抽象方法，所有历史 Collection 实现类都要改。default 方法提供二进制兼容。

**代码示例：**

```java
interface Flyable {
    void fly();
    default void glide() { System.out.println("滑翔"); }
    static Flyable create() { return new Bird(); }
}

abstract class Animal {
    private String name;
    public Animal(String name) { this.name = name; }
    abstract void eat();
}

class Bird extends Animal implements Flyable {
    public Bird() { super("鸟"); }
    public void fly() { System.out.println("飞"); }
}
```

**常见误区：**
- 以为 Java 8 后接口和抽象类没区别了——接口仍不能有实例变量、构造器、非 public 方法（Java 9 前）。
- 以为默认方法破坏了接口抽象——它是为了接口演进，不是为了多继承状态。

**版本说明：** default/static 方法自 Java 8 起；private 接口方法自 Java 9 起。

---

### 5. 异常体系

**Q：Java 异常体系是怎样的？受检异常和非受检异常区别？try-with-resources 解决什么问题？什么是异常丢失？**

**解答：**

**异常体系：**

```
Throwable
 ├── Error（不捕获，如 OOM、StackOverflowError）
 └── Exception
      ├── RuntimeException（非受检异常）
      │    ├── NullPointerException
      │    ├── IllegalArgumentException
      │    ├── IndexOutOfBoundsException
      │    └── ConcurrentModificationException
      └── 其他 Exception 子类（受检异常，如 IOException、SQLException）
```

**受检异常（Checked Exception）：** 编译期检查，必须 throws 或 try-catch。代表"可恢复的、外部条件导致的"问题。
**非受检异常（Unchecked Exception）：** RuntimeException 及其子类 + Error，编译期不强制处理。代表"程序 bug、不可恢复"。

**try-with-resources（Java 7+）：**

- 凡是实现了 `AutoCloseable`（或 `Closeable`）的资源，都可以写在 try 后的括号里，自动关闭。
- 编译器自动生成 finally 关闭逻辑，且关闭顺序与声明顺序相反。
- 比手写 finally 更安全：手写时如果 try 和 finally 都抛异常，finally 的异常会覆盖 try 的异常。

**异常丢失（Suppressed Exceptions）：**

- try-with-resources 中，如果 try 块抛异常 A，关闭资源时又抛异常 B，B 会被"抑制"，通过 `A.addSuppressed(B)` 记录，调用 `getSuppressed()` 可获取。
- 传统 finally 写法中，finally 的异常会直接覆盖 try 的异常，原始异常丢失。

**追问：**
- 追问1：Error 要不要捕获？ → 一般不捕获。OOM、StackOverflow 等 JVM 级错误通常无法恢复，捕获了也做不了什么。
- 追问2：自定义异常应该继承 Exception 还是 RuntimeException？ → 库作者倾向于用受检异常强制调用方处理；现代实践（如 Spring）倾向于非受检异常，避免强制 throws 污染代码。
- 追问3：finally 一定会执行吗？ → 不一定。`System.exit(0)`、JVM crash、守护线程被杀等场景不会执行。

**代码示例：**

```java
// 传统写法：异常可能丢失
try {
    InputStream in = new FileInputStream("a.txt");
    try {
        // read
    } finally {
        in.close(); // 如果这里抛异常，try 里的异常被覆盖
    }
} catch (IOException e) { ... }

// try-with-resources：自动关闭，异常保留 + suppressed
try (InputStream in = new FileInputStream("a.txt");
     OutputStream out = new FileOutputStream("b.txt")) {
    // read/write
} catch (IOException e) {
    e.getSuppressed(); // 可获取关闭时的附加异常
}
```

**常见误区：**
- 以为 finally 一定执行——System.exit 等场景不执行。
- 以为 catch (Exception e) 能捕获 Throwable——不能捕获 Error。
- 以为 try-with-resources 是语法糖无开销——实际是编译器改写为 try-finally 并记录 suppressed。

**版本说明：** try-with-resources 自 Java 7；effectively final 资源变量自 Java 9。

---

### 6. 泛型与类型擦除

**Q：Java 泛型是怎么实现的？什么是类型擦除？什么是桥接方法？PECS 原则是什么？**

**解答：**

**类型擦除（Type Erasure）：** Java 泛型是**编译期**特性，编译后泛型信息被擦除。`List<String>` 和 `List<Integer>` 在运行时是同一个类 `List`。编译器在编译期做类型检查，然后把泛型参数替换为擦除类型（无界擦除为 Object，有界擦除为上界），并在存取时插入强制类型转换。

**为什么这样设计：** 为了兼容 Java 5 之前的非泛型代码（原生类型 raw type），实现"泛型化前后的代码可以互操作"。这是一种妥协，代价是运行时无法获取泛型参数。

**桥接方法（Bridge Method）：** 当泛型类或接口被继承/实现时，编译器生成桥接方法保证多态行为。

例如：
```java
interface Comparable<T> { int compareTo(T o); }
class Date implements Comparable<Date> {
    public int compareTo(Date o) { ... }
}
```
擦除后 Comparable.compareTo 的签名是 `compareTo(Object)`。Date 实际写的是 `compareTo(Date)`，这不是 override。编译器生成桥接方法 `compareTo(Object o)`，内部转型后调用 `compareTo(Date)`，保证多态。

**泛型数组问题：** 不能 `new T[10]`，因为擦除后变成 `Object[10]`，写入其他类型元素不会在运行时检查。`List<String>[]` 非法，但 `?` 通配符数组可以。

**PECS 原则（Producer Extends, Consumer Super）：**

- `? extends T`：上界通配符，用于**读取**（生产者）。可以取出 T 或子类，但不能写入（除了 null）。
- `? super T`：下界通配符，用于**写入**（消费者）。可以写入 T 或子类，但读取时只能当 Object。
- 记忆：**写入用 super，读取用 extends**。

**追问：**
- 追问1：为什么不能 `new T()`？ → 运行时 T 被擦除为 Object，无法知道实际类型。需要传入 `Class<T>` 或 Supplier。
- 追问2：泛型能基本类型作参数吗？ → 不能，必须是引用类型，用 `List<Integer>` 不能 `List<int>`。
- 追问3：`List<String>` 能赋值给 `List<Object>` 吗？ → 不能，虽然 String 是 Object 子类，但泛型不型变。要型变用 `List<? extends Object>`。

**代码示例：**

```java
// PECS 示例
public static <T> void copy(List<? extends T> src, List<? super T> dest) {
    for (T t : src) dest.add(t); // src 是生产者，dest 是消费者
}

// 桥接方法验证
public class StringBox implements Box<String> {
    public void set(String s) { ... }
    // 编译器生成桥接：
    // public void set(Object o) { set((String) o); }
}
interface Box<T> { void set(T t); }
```

**常见误区：**
- 以为泛型是运行时机制——运行时只剩原始类型。
- 以为 `instanceof List<String>` 能检查——只能 `instanceof List<?>`。
- 违背 PECS 写出 `List<?>` 通配符滥用代码。

**版本说明：** Java 5 引入泛型。Java 7 diamond 语法 `<>`；Java 8 方法引用/lambda 与泛型配合。

---

### 7. 注解与反射

**Q：注解的生命周期有哪几种？反射如何获取泛型信息？反射性能开销有多大？**

**解答：**

**注解生命周期（RetentionPolicy）：**

- `SOURCE`：只在源码保留，编译期丢弃，如 `@Override`、`@SuppressWarnings`。
- `CLASS`：编译到 class 文件，运行时不加载，是默认值。
- `RUNTIME`：运行时保留，可被反射读取，如 `@Retention(RUNTIME)` + `@Target`。

**元注解：** `@Target`（作用目标）、`@Retention`（生命周期）、`@Documented`、`@Inherited`、`@Repeatable`。

**反射获取泛型：** 由于类型擦除，`field.getType()` 只能拿到原始类型。要获取泛型参数，用 `field.getGenericType()`，返回 `ParameterizedType`，再调用 `getActualTypeArguments()`。

**反射性能：**

- 反射比直接调用慢，因为要做安全检查、方法查找、参数装箱。
- JDK 17+ 对反射有更强封装（强封装 JDK 内部 API），`--add-opens` 才能深度反射。
- 优化：缓存 Method/Field 对象；`setAccessible(true)` 跳过安全检查；MethodHandle/LambdaMetafactory 比传统反射快。

**追问：**
- 追问1：注解能继承吗？ → 默认不能，但 `@Inherited` 元注解标注的注解会被子类继承（仅对类继承有效，接口实现不算）。
- 追问2：反射能访问 private 字段吗？ → 能，`field.setAccessible(true)`。但 Java 9 模块系统会限制跨模块深度反射。
- 追问3：自定义注解要运行时可读，必须配什么？ → `@Retention(RetentionPolicy.RUNTIME)`，否则反射拿不到。

**代码示例：**

```java
// 自定义运行时注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Config { String value(); }

class App {
    @Config("timeout.ms")
    private int timeout;
}

// 反射读取注解 + 泛型
Field f = App.class.getDeclaredField("timeout");
Config c = f.getAnnotation(Config.class);
System.out.println(c.value()); // timeout.ms

// 获取泛型参数
List<String> list = new ArrayList<>();
Field f2 = ...; // 假设拿到 List<String> 字段
ParameterizedType pt = (ParameterizedType) f2.getGenericType();
Type[] args = pt.getActualTypeArguments(); // [String.class]
```

**常见误区：**
- 以为注解默认 RUNTIME——默认是 CLASS。
- 以为 `getGenericType` 一定是 ParameterizedType——可能是 TypeVariable 或 WildcardType，需要 instanceof 判断。
- 忽略反射的安全开销，在热点路径大量反射。

**版本说明：** Java 5 注解；Java 8 重复注解；Java 9 模块系统强封装。

---

### 8. Java 8+ 新特性

**Q：Java 8 有哪些重要新特性？Lambda、Stream、Optional、CompletableFuture 各解决什么问题？**

**解答：**

**Lambda 表达式：** 本质是函数式接口的实例（只有一个抽象方法的接口）。Lambda 让代码更简洁，支持行为参数化。

**Stream API：** 对集合做声明式处理。分为中间操作（filter、map、sorted，惰性求值）和终端操作（collect、forEach、count，触发计算）。注意 Stream 只能消费一次，关闭后再用会抛 `IllegalStateException`。

**Optional：** 容器对象，用于显式表达"可能为空"，避免 NPE。`ofNullable`、`orElse`、`orElseGet`、`map`、`ifPresent`。不要把 Optional 当字段或方法参数（设计意图是返回值）。

**CompletableFuture：** 异步编程的核心类，支持链式组合（thenApply、thenCompose、thenCombine）、异常处理（exceptionally）、等待多个任务（allOf、anyOf）。比 Future 强大在可以回调式编排。

**其他：** 接口默认方法、方法引用、新日期时间 API（java.time，不可变、线程安全）、LongAdder、原子增强。

**追问：**
- 追问1：Stream 是并行的吗？ → 默认串行，调用 `parallel()` 转为 ForkJoinPool.commonPool 并行流。共享池在 CPU 密集任务时合适，IO 密集会阻塞其他任务。
- 追问2：Optional 能替代 null 检查吗？ → 它鼓励调用方显式处理空，但不能完全替代。滥用 Optional（如 `Optional<T>` 作字段）反而增加包装开销。
- 追问3：CompletableFuture 默认线程池是什么？ → ForkJoinPool.commonPool。生产中建议传入自定义 Executor，避免公共池被慢任务占满。

**代码示例：**

```java
// Stream 流水线
List<String> result = list.stream()
    .filter(s -> s.startsWith("a"))
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());

// Optional 链式
String name = user.map(User::getAddress)
                   .map(Address::getCity)
                   .orElse("未知");

// CompletableFuture 编排
CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> "hello");
CompletableFuture<String> f2 = f1.thenApply(s -> s + " world");
CompletableFuture<String> f3 = f2.thenCompose(s -> CompletableFuture.supplyAsync(() -> s + "!"));
String r = f3.get(); // hello world!
```

**常见误区：**
- 以为 parallel() 一定更快——IO 密集或小数据量反而更慢。
- 以为 Optional 可以序列化——Optional 不实现 Serializable。
- 在 Stream 里修改外部变量（副作用）——破坏不可变意图，并行时会出错。

**版本说明：** Lambda/Stream/Optional/CompletableFuture 自 Java 8。Java 9 Stream 增加 takeWhile/dropOf/ofNullable；Java 16 pattern matching（预览）；Java 17 正式 switch 表达式。

---

### 9. equals() 与 hashCode() 契约

**Q：为什么重写 equals() 必须同时重写 hashCode()？违反了会怎样？**

**解答：**

**契约（Object 规范）：**

1. **自反性**：`x.equals(x) == true`。
2. **对称性**：`x.equals(y) == y.equals(x)`。
3. **传递性**：`x.equals(y) && y.equals(z) → x.equals(z)`。
4. **一致性**：多次调用结果不变。
5. **非空性**：`x.equals(null) == false`。

**hashCode 契约：**

- 同一对象多次调用必须返回同一个 int。
- `a.equals(b)` 为 true → `a.hashCode() == b.hashCode()`。
- `a.hashCode() != b.hashCode()` → `!a.equals(b)`（逆否命题）。

**为什么必须同时重写：** HashMap、HashSet 等基于哈希的集合，先用 hashCode 定位桶，再用 equals 在桶内查找。如果两个 equals 相等的对象 hashCode 不同，会被放到不同桶，HashSet 认为它们不重复，导致重复存储。

**违反后果：** 把对象放入 HashSet 后，修改参与 equals 计算的字段，导致 hashCode 变化，之后 `contains` 找不到该对象，内存中也无法 remove，造成"幽灵对象"。

**追问：**
- 追问1：equals 相等 hashCode 一定相等吗？ → 契约要求必须相等。反之不要求（hash 冲突允许）。
- 追问2：重写 equals 为什么要 getClass() 还是 instanceof？ → instanceof 破坏对称（子类 equals 父类）。LSP 场景下推荐 getClass()，除非父类定义了基于某个字段的 equals 且子类不扩展语义（如 Lombok @Value 可设 callSuper）。
- 追问3：JDK 7+ 的 Objects.equals/hash 工具？ → 避免手写 null 检查和 hash 组合，`Objects.hash(a, b, c)`。

**代码示例：**

```java
public class User {
    private final String id;
    private final String name;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User u = (User) o;
        return Objects.equals(id, u.id) && Objects.equals(name, u.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }
}
```

**常见误区：**
- 只重写 equals 不重写 hashCode。
- 用 mutable 字段参与 equals/hashCode，对象入集合后修改字段导致定位失效。
- equals 里把参数强转前不先类型检查，导致 CCE。

**版本说明：** Java 7+ `java.util.Objects` 工具类。

---

### 10. 值传递还是引用传递

**Q：Java 是值传递还是引用传递？**

**解答：**

**结论：Java 只有值传递。**

对于基本类型，传递的是值的副本；对于引用类型，传递的是**引用本身的值的副本**——栈上的引用变量存的是堆对象的地址，把这个地址值复制一份传给方法。方法内通过这个副本引用可以修改堆对象的内容，但把引用本身重新指向另一个对象，不会影响调用方的原引用。

**关键区分：**

- 传递引用类型时，方法内 `param = new Object()` 不会让调用方的变量指向新对象——因为传的是副本。
- 但方法内 `param.setXxx(...)` 会修改堆对象，因为副本指向的还是同一个堆对象。

**追问：**
- 追问1：为什么不是引用传递？ → 引用传递的定义是"方法拿到的是原变量本身的别名"，可以改变原变量指向。Java 做不到这一点。
- 追问2：String 作为参数传入方法，方法内修改后调用方会变吗？ → 不会。String 不可变，且传的是引用副本，方法内 `str = "new"` 只是让副本指向新字符串。

**代码示例：**

```java
public static void swap(int a, int b) {
    int t = a; a = b; b = t;
}
int x = 1, y = 2; swap(x, y);
// x 仍 1, y 仍 2，因为传的是副本

public static void reassign(User u) {
    u = new User("new"); // 只改了副本指向
}
public static void mutate(User u) {
    u.setName("new"); // 改的是同一个堆对象
}
User u = new User("old");
reassign(u); // u 仍是 old
mutate(u);   // u.name 变成 new
```

**常见误区：**
- 误以为"对象传递就是引用传递"——混淆了"传引用"和"引用传递"两个概念。
- 试图在方法内交换两个对象引用——Java 做不到，需要用数组或 AtomicReference 包装。

**版本说明：** 语言规范层面自 Java 1.0 即如此。

---

## 二、JVM
### 1. JVM 内存区域划分

**Q：JVM 运行时数据区有哪些？哪些线程共享、哪些线程私有？**

**解答：**

**线程私有（生命周期随线程）：**

1. **程序计数器（PC Register）**：当前线程执行字节码的行号指示器。唯一一个没有 OutOfMemoryError 的区域。
2. **Java 虚拟机栈（VM Stack）**：每个方法调用创建一个栈帧（局部变量表、操作数栈、动态链接、方法出口）。栈太深（无限递归）抛 StackOverflowError；扩展不了抛 OOM。
3. **本地方法栈（Native Method Stack）**：为 native 方法服务，HotSpot 把它和虚拟机栈合二为一。

**线程共享：**

4. **堆（Heap）**：所有对象实例和数组的分配区域（逃逸分析后可能栈上分配）。GC 主要在这里进行。分为新生代（Eden + Survivor 0/1）和老年代。
5. **方法区（Method Area）**：存储类信息、常量、静态变量、JIT 编译后的代码。Java 8 之前是永久代（PermGen，堆的一部分），Java 8 改为元空间（Metaspace，使用本地内存）。

**直接内存（Direct Memory）：** 不算 JVM 运行时数据区，但 NIO 的 DirectByteBuffer 使用，也会 OOM。

**追问：**
- 追问1：堆为什么分代？ → 不同对象生命周期不同。新生代对象朝生夕死，用复制算法；老年代存活率高，用标记-整理。分代让 GC 效率最优。
- 追问2：栈里存什么？ → 栈帧：局部变量表（基本类型 + 对象引用）、操作数栈、动态链接、返回地址。
- 追问3：对象一定分配在堆上吗？ → 不一定。逃逸分析后，不会逃出方法的对象可能栈上分配（标量替换），减少 GC 压力。

**代码示例（查看内存）：**

```bash
# JVM 参数示例
-Xms2g -Xmx2g        # 堆初始/最大值
-Xmn1g               # 新生代大小
-XX:MetaspaceSize=256m
-XX:+HeapDumpOnOutOfMemoryError
```

**常见误区：**
- 以为方法区在堆里——Java 8 元空间在本地内存，不在堆。
- 以为程序计数器会 OOM——它是唯一只读指针无 OOM 的区域。

**版本说明：** Java 8 永久代 → 元空间。Java 11 ZGC 等新回收器变化不影响区域划分。

---

### 2. 垃圾标记算法

**Q：JVM 怎么判断对象可以被回收？GC Roots 有哪些？**

**解答：**

**引用计数法：** 给对象加引用计数器，新增引用 +1，失效 -1，为 0 则回收。简单但**无法解决循环引用**（A 引用 B，B 引用 A，都不为 0）。JVM 不使用这种方法。

**可达性分析（Reachability Analysis）：** 从 **GC Roots** 出发，沿引用链遍历，不可达的对象判定为可回收。

**GC Roots 包括：**

1. 虚拟机栈（栈帧局部变量表）中引用的对象。
2. 方法区中静态变量引用的对象。
3. 方法区中常量引用的对象。
4. 本地方法栈 JNI（native 方法）引用的对象。
5. Java 虚拟机内部引用（基本类型 Class、异常对象、类加载器）。
6. 同步锁 `synchronized` 持有的对象。
7. JMXBean、JVMTI 等隐含引用。

**引用强度（Java 4+）：**

- **强引用**：`Object o = new Object()`，永不回收。
- **软引用（SoftReference）**：内存不足时回收，适合缓存。