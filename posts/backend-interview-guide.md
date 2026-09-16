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
- **弱引用（WeakReference）**：下次 GC 就回收，如 WeakHashMap 的 key。
- **虚引用（PhantomReference）**：唯一作用是回收时收到通知，用于管理堆外内存。

**追问：**
- 追问1：为什么引用计数法不行？ → 循环引用问题，主流 JVM 都用可达性分析。
- 追问2：静态变量为什么是 GC Roots？ → 因为静态变量在方法区，随类生命周期，不会被 GC。
- 追问3：不可达对象一定被回收吗？ → 不一定。要经过两次标记：第一次标记+筛选（是否有必要执行 finalize()），有 finalize 且未执行过的放入 F-Queue，由低优先级线程执行，第二次标记后才真正回收。不推荐用 finalize()。

**常见误区：**
- 以为 GC Roots 包括所有对象——只包括"活的起点"。
- 以为弱引用一定会马上回收——下次 GC 才回收。
- 误以为可以用 finalize 做资源清理——不可靠，Java 9 已废弃。

**版本说明：** 引用体系自 Java 1.2；finalize 在 Java 9 被 Deprecated。

---

### 3. 垃圾收集算法

**Q：讲讲几种垃圾收集算法，各自适用场景？**

**解答：**

**标记-清除（Mark-Sweep）：** 先标记所有要回收的对象，然后统一清除。
- 缺点：产生大量内存碎片；碎片多了大对象找不到连续空间会提前触发 Full GC。
- 适用：老年代（存活率高）。

**标记-复制（Mark-Copy）：** 把内存分为两块，每次只用一块，回收时把存活对象复制到另一块，然后整块清空。
- 优点：无碎片，分配快。
- 缺点：内存利用率只有 50%。
- 改进：新生代 Eden:Survivor = 8:1:1，每次只用 90%，存活对象复制到 Survivor，浪费 10%。
- 适用：新生代（朝生夕死，存活率低）。

**标记-整理（Mark-Compact）：** 标记后让所有存活对象向一端移动，然后清理边界外内存。
- 优点：无碎片，内存利用率 100%。
- 缺点：移动对象要更新引用，开销大。
- 适用：老年代。

**分代收集：** 综合以上——新生代用复制，老年代用标记-清除或标记-整理。

**追问：**
- 追问1：为什么新生代 Eden:Survivor = 8:1:1？ → 新生代对象 98% 朝生夕死，Eden 占 80% 足够大，Survivor 各 10% 能容纳少量存活对象。
- 追问2：复制算法浪费 10%，为什么不用 50%？ → 50% 利用率太低；8:1:1 在存活率 10% 以内时足够，超了会触发担保（老年代分配）。
- 追问3：标记整理为什么慢？ → 移动对象 + 并发更新所有引用，STW 时间长。

**常见误区：**
- 以为老年代用标记-清除——CMS 用标记-清除，G1/Shenandoah/ZGC 用标记-整理（或复制）。

**版本说明：** 分代思想自早期 JDK；G1 开始 Region 化打破物理分代。

---

### 4. 经典垃圾收集器

**Q：讲讲 Serial、ParNew、Parallel Scavenge、CMS、G1、ZGC 的特点和适用场景？**

**解答：**

**Serial / Serial Old：** 单线程收集器，STW。Client 模式或小堆应用。
**ParNew：** Serial 多线程版，配合 CMS 使用。
**Parallel Scavenge / Parallel Old：** 新生代复制 + 老年代整理，多线程。目标是**吞吐量**（运行用户代码时间/总时间）。适合后台计算类任务。JDK 8 默认。

**CMS（Concurrent Mark Sweep，Concurrent Mark-Sweep）：** 低停顿收集器，老年代使用。
- 四阶段：初始标记（STW）→ 并发标记 → 重新标记（STW）→ 并发清除。
- 优点：并发收集，低停顿。
- 缺点：标记-清除有碎片；对 CPU 敏感；Concurrent Mode Failure 时退化为 Serial Old（Full GC STW）。
- Java 9 废弃，Java 14 移除。

**G1（Garbage First）：** JDK 9 默认收集器。把堆划分为多个大小相等的 Region（1~32MB），每个 Region 可以是 Eden/Survivor/Old/Humongous。
- 优先回收垃圾最多的 Region（Garbage First）。
- 可预测停顿时间模型（`-XX:MaxGCPauseMillis`）。
- 整体并发，Region 间复制无碎片。
- 适合大堆（6GB+）、低延迟需求。

**ZGC（Z Garbage Collector）：** JDK 11 引入，JDK 15 成熟。
- 目标：STW 不超过 10ms，且不随堆大小增长。
- 染色指针（Colored Pointers）+ 读屏障实现并发标记/转移/重定位。
- 支持 TB 级堆。
- JDK 16 并发栈处理；JDK 21 分代 ZGC。

**Shenandoah：** RedHat 主导，类似 ZGC，并发整理，低停顿。

**追问：**
- 追问1：CMS 为什么被废弃？ → 碎片问题、Concurrent Mode Failure 退化为 Serial Old、维护成本高，G1/ZGC 已经更优。
- 追问2：G1 为什么比 CMS 好？ → 无碎片（整理）、可预测停顿、Region 化更灵活。
- 追问3：ZGC 怎么做到 10ms 以下？ → 染色指针把 GC 信息藏在指针高位，读写并发转移时用读屏障"自愈"引用，避免 STW 更新引用。

**常见误区：**
- 以为 Parallel Scavenge 是低延迟——它是高吞吐量。
- 以为 G1 适合所有场景——小堆应用 Serial/Parallel 反而简单高效。

**版本说明：** CMS JDK 9 废弃/JDK 14 移除；G1 JDK 9 默认；ZGC JDK 11 引入/JDK 15 生产可用/JDK 21 分代。

---

### 5. 类加载机制

**Q：讲讲类加载过程和双亲委派模型？什么情况下会破坏双亲委派？**

**解答：**

**类加载过程（7 步）：**

1. **加载（Loading）**：通过类全限定名获取字节流，生成 Class 对象。
2. **验证（Verification）**：验证字节码合法性（文件格式、元数据、字节码、符号引用）。
3. **准备（Preparation）**：静态变量分配内存并赋零值（如 `static int x = 123`，准备阶段 x=0，初始化才是 123）。`static final` 常量在此阶段赋值。
4. **解析（Resolution）**：符号引用替换为直接引用（内存指针）。
5. **初始化（Initialization）**：执行 `<clinit>()`，即静态变量赋值 + static 块。
6. **使用（Using）**。
7. **卸载（Unloading）**。

**双亲委派模型（Parent Delegation）：**

类加载器层次：
- **Bootstrap ClassLoader**：C++ 写，加载 `rt.jar` 等核心类（`java.lang.*`）。
- **ExtClassLoader / PlatformClassLoader**（Java 8 叫 Ext，Java 9 叫 Platform）：加载扩展类。
- **AppClassLoader / SystemClassLoader**：加载 classpath。

**工作流程：** 收到加载请求时，先委托给父加载器，父加载器加载不了，子加载器才自己尝试加载。

**为什么这样设计：** 安全。防止核心类（如 `java.lang.String`）被恶意替换——无论谁加载，最终都委派到 Bootstrap，加载的是 JDK 自带的 String。

**破坏双亲委派的场景：**

1. **JDBC**：DriverManager 是 rt.jar 中的类（Bootstrap 加载），要加载第三方 jar 中的 Driver 实现。Bootstrap 看不到 classpath，所以引入了**线程上下文类加载器（TCCL）**，反向委派 AppClassLoader 加载。
2. **OSGi / 模块化**：每个 Bundle 有自己的类加载器，网状委派。
3. **Tomcat**：每个 WebApp 有独立 ClassLoader，先自己加载（WebappClassLoader），再委派父加载器——为了应用隔离。
4. **SPI 机制**：`ServiceLoader` 配合 TCCL。

**追问：**
- 追问1：如何自定义类加载器？ → 继承 ClassLoader，重写 `findClass()`（不是 loadClass，loadClass 是双亲委派逻辑）。
- 追问2：Tomcat 为什么打破双亲委派？ → 多个 Web 应用部署在一个 Tomcat，需要隔离（不同应用的同名类不能互相影响），所以先自己加载。
- 追问3：类初始化时机？ → new、反射、子类初始化触发父类初始化、main 类、static 调用等。

**代码示例：**

```java
// 自定义类加载器（保留双亲委派）
class MyClassLoader extends ClassLoader {
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] bytes = loadClassBytes(name); // 从磁盘/网络读取
        return defineClass(name, bytes, 0, bytes.length);
    }
}
```

**常见误区：**
- 以为重写 loadClass 就是双亲委派——应该重写 findClass，否则会破坏委派。
- 以为 `static int x = 123` 在准备阶段赋值——准备阶段是 0，初始化才是 123。

**版本说明：** Java 9 引入模块化（JPMS），类加载器层次有调整（Bootstrap 不再是单一 ClassLoader）。

---

### 6. JVM 调优与排查工具

**Q：常用 JVM 调优参数有哪些？OOM 怎么排查？**

**解答：**

**常用参数：**

```bash
# 堆
-Xms / -Xmx        # 初始/最大堆（建议设相同避免动态扩缩）
-Xmn               # 新生代大小
-XX:NewRatio=2     # 老年代:新生代 = 2:1
-XX:SurvivorRatio=8

# 元空间
-XX:MetaspaceSize / -XX:MaxMetaspaceSize

# GC
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+PrintGCDetails -Xloggc:gc.log  # JDK 9+ 用 -Xlog:gc*

# OOM dump
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dump.hprof
```

**OOM 排查流程：**

1. **拿到 heap dump**：`-XX:+HeapDumpOnOutOfMemoryError` 自动生成。
2. **MAT / JProfiler 分析 dump**：看 Dominator Tree，找占用最大的对象，排查泄漏点。
3. **常见泄漏场景**：ThreadLocal 未 remove、静态集合无限增长、未关闭连接、监听器未注销。

**jstat / jmap / jstack / jhat：**

- **jstat -gcutil <pid> 1s**：实时看各代使用率、GC 次数/时间。
- **jmap -heap <pid>**：堆配置。
- **jmap -dump:format=b,file=heap.hprof <pid>**：手动 dump。
- **jstack <pid>**：线程栈，排查死锁、CPU 高（找到 busy 线程看栈）。
- **jhat**（已废弃）：分析 dump。
- **jcmd**（推荐）：统一诊断入口，`jcmd <pid> Thread.print`、`jcmd <pid> GC.heap_info`。

**CPU 高排查：**

```bash
top -Hp <pid>          # 找最忙的线程 pid
printf "%x\n" <tid>    # 转十六进制
jstack <pid> | grep <hex_tid>  # 看栈
```

**追问：**
- 追问1：为什么 -Xms 和 -Xmx 设成一样？ → 避免堆动态扩缩的抖动，启动时一次性分配。
- 追问2：jmap -dump 会 STW 吗？ → 会。线上用 jmap:live 或 jcmd GC.heap_dump，大堆会暂停很久。
- 追问3：怎么判断 CPU 高是代码问题还是 GC 问题？ → jstat 看 GC 频率；如果 GC 时间占比高，先 GC 问题，否则看业务线程栈。

**常见误区：**
- 盲目调大堆——大堆导致 Full GC STW 更长。
- 用 jmap dump 生产大堆——应先在小流量节点或用 jcmd 异步 dump。

**版本说明：** JDK 9 统一日志（-Xlog）；jhat 已移除；jcmd 取代大部分 jmap/jstack 功能。

---

### 7. 方法区 / 元空间变迁

**Q：为什么永久代被移除？元空间有什么变化？**

**解答：**

**永久代（PermGen，Java 7 及之前）：** 方法区的实现，是堆的一部分，有固定上限（`-XX:MaxPermSize`）。存储类信息、常量、静态变量。

**问题：**
- 大小难以预估，类加载多了容易 OOM: PermGen space。
- 与 GC 联动差，回收效率低。
- JRockit（BEA 的 JVM，后被 Oracle 收购）没有永久代，HotSpot 要融合 JRockit，需要移除永久代。

**元空间（Metaspace，Java 8+）：**

- 使用**本地内存**（不再是堆的一部分），默认最大是系统可用内存。
- 类元数据存到本地内存的元空间。
- 字符串常量池移到堆（Java 7 已经移了）。
- 静态变量也移到堆（Java 8）。
- 仍有 OOM：`OutOfMemoryError: Metaspace`。
- 参数：`-XX:MetaspaceSize`（初始高水位，超过触发 Full GC）、`-XX:MaxMetaspaceSize`（建议设置，避免吃光本地内存）。

**追问：**
- 追问1：字符串常量池在哪？ → Java 6 在永久代，Java 7 移到堆，Java 8 仍在堆。
- 追问2：元空间用本地内存，会不会让 JVM 不稳定？ → 可能吃光系统内存，所以要设 MaxMetaspaceSize。
- 追问3：为什么 Java 8 不直接用堆存类元数据？ → 永久代在堆导致 GC 复杂（要扫描堆外元数据），本地内存可以独立管理。

**常见误区：**
- 以为元空间无 OOM——只是搬到本地内存，仍可能超限。
- 以为字符串常量池在方法区——Java 7 起在堆。

**版本说明：** Java 7 字符串常量池入堆；Java 8 永久代 → 元空间；Java 9 模块化进一步封装。

---

### 8. 对象创建与内存布局

**Q：new 一个对象的过程是怎样的？对象在内存里怎么布局？什么是指针压缩？**

**解答：**

**对象创建过程（new）：**

1. **类加载检查**：检查 new 的类是否已加载、解析、初始化。没有则先类加载。
2. **分配内存**：堆中划分内存。
   - 指针碰撞（Bump the Pointer）：内存规整时用指针移动。
   - 空闲列表（Free List）：内存不规整时维护空闲块列表。
   - 并发安全：CAS + 失败重试，或 **TLAB（Thread Local Allocation Buffer）**——每个线程在 Eden 预分配一小块，线程内分配无锁。
3. **零值初始化**：对象字段赋零值（保证代码不访问即可用）。
4. **设置对象头**：Mark Word、类型指针（Klass Pointer）。
5. **执行 `<init>()`**：构造器。

**对象内存布局：**

- **对象头（Header）**：
  - Mark Word（8 字节，64 位 JVM）：哈希码、GC 分代年龄、锁状态标志、线程持有的锁、偏向线程 ID。
  - 类型指针 Klass Pointer：指向方法区类元数据。开启指针压缩后 4 字节。
  - 数组长度（如果是数组）。
- **实例数据（Instance Data）**：字段内容。
- **对齐填充（Padding）**：HotSpot 要求对象大小是 8 字节整数倍。

**指针压缩（Compressed Oops）：** 64 位 JVM 上，堆小于 32GB 时，用 32 位指针（4 字节）表示堆内偏移（按 8 字节对齐除以 8），可寻址 32GB。节省内存，提高缓存效率。`-XX:+UseCompressedOops`（默认开）。

**追问：**
- 追问1：为什么对象要对齐？ → HotSpot 要求对象起始地址是 8 字节整数倍，便于快速寻址。
- 追问2：TLAB 是什么？ → 每个线程在 Eden 私有区域分配对象，避免多线程分配竞争。
- 追问3：对象一定在堆上吗？ → 逃逸分析后，未逃逸对象可能栈上分配或标量替换（对象拆散成局部变量）。

**常见误区：**
- 以为 new 一定在堆——逃逸分析后栈上分配。
- 以为对象头里存的是字段默认值——对象头只有 Mark Word + 类型指针。

**版本说明：** TLAB 自早期 HotSpot；指针压缩自 JDK 6u23；逃逸分析栈上分配自 JDK 7。

---

### 9. Java 内存模型 JMM

**Q：什么是 JMM？happens-before 是什么？volatile 保证什么？**

**解答：**

**JMM（Java Memory Model）：** 定义了多线程下共享变量的访问规则。每个线程有自己的工作内存（CPU 寄存器/缓存），共享变量在主内存。线程不能直接读写主内存，必须通过工作内存中转。JMM 规定了何时线程的写入对另一线程可见、何时要刷新到主内存。

**三大特性：**

- **可见性**：一个线程修改了共享变量，其他线程能立即看到。
- **原子性**：操作不可分割，要么全成功要么全失败。
- **有序性**：程序执行顺序。编译器和 CPU 会指令重排，JMM 禁止特定类型的重排。

**happens-before 原则（前一个操作的结果对后一个可见）：**

1. 程序次序规则：单线程内，前操作 happens-before 后操作。
2. 锁规则：unlock happens-before 后续 lock。
3. volatile 规则：volatile 写 happens-before 后续 volatile 读。
4. 传递性：A happens-before B，B happens-before C → A happens-before C。
5. 线程启动规则：start() happens-before 线程内操作。
6. 线程终止规则：线程内操作 happens-before 其他线程检测到它结束。
7. 对象终结规则：构造器结束 happens-before finalize。

**volatile 语义：**

- **可见性**：写 volatile 立即刷主内存，读 volatile 从主内存读。
- **禁止指令重排**：插入内存屏障（StoreStore / StoreLoad / LoadLoad / LoadStore）。
- **不保证原子性**：`volatile int i; i++` 仍非线程安全（读-改-写三步）。

**典型应用：双重检查锁单例：**

```java
public class Singleton {
    private static volatile Singleton instance; // 必须 volatile

    public static Singleton getInstance() {
        if (instance == null) {               // 第一次检查
            synchronized (Singleton.class) {
                if (instance == null) {        // 第二次检查
                    instance = new Singleton(); // 非原子：分配内存→构造→赋值
                }
            }
        }
        return instance;
    }
}
```

为什么要 volatile？`new Singleton()` 不是原子操作，可能重排为：分配内存 → 赋值引用 → 构造对象。其他线程在第一次检查时看到非 null 但未构造完的对象。volatile 禁止重排。

**追问：**
- 追问1：volatile 能保证原子性吗？ → 不能。i++ 是读-改-写三步。
- 追问2：synchronized 和 volatile 区别？ → synchronized 保证原子性+可见性+有序性，volatile 只保证可见性和有序性，不保证原子性。
- 追问3：happens-before 是不是时间先后？ → 不是。它是 JMM 的偏序关系，保证前一个操作的结果对后一个可见。

**常见误区：**
- 以为 volatile 能保证 i++ 安全——不能。
- 以为 happens-before 是时间先后——它是可见性保证，不是物理时间。
- 双重检查锁不加 volatile——有读到半初始化对象的风险。

**版本说明：** JMM 自 Java 5 JSR-133 修订，volatile 语义大幅强化。

---

### 10. Full GC 触发条件与避免

**Q：什么情况下会触发 Full GC？如何避免频繁 Full GC？**

**解答：**

**Full GC 触发条件：**

1. **老年代空间不足**：新生代 Minor GC 后，存活对象太大放不下老年代。
2. **方法区/元空间不足**：类加载过多、常量池满。
3. **`System.gc()` 显式调用**（可被 `-XX:+DisableExplicitGC` 禁用）。
4. **空间分配担保失败**：Minor GC 前检查老年代连续空间是否大于新生代对象总和，不满足且不允许担保失败则 Full GC。
5. **CMS 的 Concurrent Mode Failure**：并发标记时老年代不够用，退化为 Serial Old Full GC。
6. **晋升失败（Promotion Failed）**：Survivor 放不下，要晋升老年代，但老年代也没空间。

**Minor GC vs Full GC：**

- Minor GC：回收新生代，STW 但快，频繁发生。
- Full GC：回收整个堆 + 方法区，STW 长，应避免。

**避免频繁 Full GC：**

1. 合理设置堆大小和各代比例。
2. 避免大对象（大数组、大字符串）直接进老年代。
3. 控制对象生命周期，及时释放无用引用。
4. 监控晋升速率，调整 Survivor 大小让对象在新生代就回收。
5. 选择合适收集器（G1/ZGC）降低 Full GC STW。
6. 检查内存泄漏（静态集合、ThreadLocal、连接未关）。

**追问：**
- 追问1：Minor GC 一定 STW 吗？ → 是。新生代收集必须暂停所有应用线程，保证遍历准确性。
- 追问2：为什么大对象直接进老年代？ → 大对象在 Eden 和 Survivor 之间复制开销大，JVM 设 `-XX:PretenureSizeThreshold` 超过直接进老年代。
- 追问3：空间分配担保是什么？ → Minor GC 前检查老年代连续空间是否足够容纳所有新生代对象，不够则看是否允许担保失败（HandlePromotionFailure）。

**常见误区：**
- 以为 Full GC 一定堆满——元空间满、System.gc()、担保失败也会触发。
- 频繁 Full GC 就调大堆——可能是泄漏，要先 dump。

**版本说明：** G1/ZGC 的 Full GC 触发逻辑不同（G1 有 Mixed GC，ZGC 基本不 Full GC）。

---

## 三、并发与多线程
### 1. synchronized 底层原理

**Q：synchronized 底层是怎么实现的？锁升级过程？偏向锁、轻量级锁、重量级锁区别？**

**解答：**

**底层实现：** synchronized 基于对象头的 Mark Word 和 Monitor（管程）实现。

- **同步代码块**：字节码里 `monitorenter` 和 `monitorexit` 指令。monitorenter 尝试获取对象的 Monitor，计数器 +1；monitorexit 计数器 -1，归 0 释放。
- **同步方法**：方法访问标志 `ACC_SYNCHRONIZED`，调用时检查是否持有 monitor。

**Monitor**：每个对象关联一个管程，本质是互斥锁。包含 EntryList（等待队列）、WaitSet（wait 队列）、owner（持有线程）。

**锁升级（Java 6+ 引入锁优化）：**

1. **无锁状态**。
2. **偏向锁**：第一个线程进入时，在 Mark Word 记录线程 ID。以后该线程再进入，只要 CAS 修改 threadId，几乎无开销。其他线程竞争时撤销偏向。
3. **轻量级锁**：有多个线程交替进入（不真竞争），线程在栈帧中生成 Lock Record，CAS 把 Mark Word 替换为指向 Lock Record 的指针。成功则获锁；失败自旋。
4. **重量级锁**：自旋失败（真竞争），升级为操作系统互斥量（Mutex），线程挂起阻塞。

**注意：** 锁只能升级不能降级。Java 15 开始偏向锁默认关闭（维护成本高，现代 JVM 竞争场景下收益小）。

**追问：**
- 追问1：synchronized 锁的是对象还是类？ → 实例方法锁 this，静态方法锁 Class 对象，代码块锁括号里的对象。
- 追问2：为什么偏向锁在 Java 15 关闭？ → 现代应用多线程竞争常见，偏向锁撤销成本高，维护代价大于收益。
- 追问3：自旋锁为什么现在用适应性自旋？ → 固定自旋次数可能浪费 CPU；JVM 记录最近自旋成功率，动态调整次数。

**代码示例：**

```java
synchronized (lock) { ... }       // 同步代码块
public synchronized void m() {}  // 同步实例方法，锁 this
public static synchronized void m() {} // 锁 Xxx.class
```

**常见误区：**
- 以为 synchronized 是纯用户态锁——重量级锁是 OS 互斥量，线程挂起。
- 以为锁升级会降级——只会升级。
- 以为 synchronized 可中断——不可中断，要 interrupt 用 ReentrantLock。

**版本说明：** Java 6 引入偏向锁/轻量级锁/自旋；Java 15 偏向锁默认关闭并废弃。

---

### 2. volatile 关键字

**Q：volatile 保证什么？不保证什么？双重检查锁单例为什么要 volatile？**

**解答：**

**volatile 保证：**

1. **可见性**：写 volatile 变量后立即刷新主内存，读 volatile 变量从主内存读。一个线程的修改对其他线程立即可见。
2. **禁止指令重排**：通过内存屏障（Memory Barrier）禁止编译器和 CPU 重排特定操作。
   - volatile 写前插入 StoreStore 屏障，写后插入 StoreLoad 屏障。
   - volatile 读前插入 LoadLoad，读后插入 LoadStore。

**volatile 不保证：**

- **原子性**：`i++` 是读-改-写三步，volatile 只保证每次读到的是最新值，但并发下两个线程同时读再各写仍会丢更新。
- **复合操作安全**：volatile 不替代锁。

**典型应用：双重检查锁（DCL）单例：**

```java
public class Singleton {
    private static volatile Singleton instance;

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

`new Singleton()` 在字节码层面分三步：
1. 分配内存。
2. 调用构造器初始化。
3. 把引用赋值给 instance。

如果不加 volatile，JIT 可能重排为 1 → 3 → 2。另一个线程第一次检查看到 instance 非 null，但对象还没构造完，拿到半成品对象。volatile 禁止这个重排。

**其他应用：** 状态标志位（如 `volatile boolean running`）、一写多读场景。

**追问：**
- 追问1：volatile 和 synchronized 区别？ → volatile 轻量，只保证可见性和有序性，不保证原子性，不能阻塞线程；synchronized 保证三者且互斥。
- 追问2：volatile 能替代 Lock 吗？ → 不能，复合操作需要锁。
- 追问3：什么是内存屏障？ → CPU 指令，禁止屏障两侧指令重排，并强制刷新缓存。LoadLoad、StoreStore、LoadStore、StoreLoad 四类。

**常见误区：**
- 以为 volatile 保证 i++ 安全——不能。
- 以为 volatile 不耗性能——可见性要求刷新主内存，有一定开销。

**版本说明：** Java 5 JSR-133 强化 volatile 语义（此前 volatile 不禁止重排）。

---

### 3. AQS 原理

**Q：AQS 是什么？state、CLH 队列、独占/共享模式？**

**解答：**

**AQS（AbstractQueuedSynchronizer）** 是 JUC 锁和同步器的核心框架，ReentrantLock、Semaphore、CountDownLatch、ReentrantReadWriteLock 都基于它。

**核心组成：**

1. **state**：volatile int，表示同步状态。不同实现语义不同：
   - ReentrantLock：state 表示重入次数。
   - Semaphore：state 表示剩余许可数。
   - CountDownLatch：state 表示剩余计数。
   - 通过 CAS 修改 state。

2. **CLH 队列（变种）**：双向链表（FIFO），存放等待获取锁的线程。获取锁失败的线程包装成 Node 入队，park 挂起。前驱节点释放后唤醒后继节点。

3. **独占模式**：同一时刻只有一个线程能持有。`tryAcquire` / `tryRelease`。
4. **共享模式**：多个线程可同时持有。`tryAcquireShared` / `tryReleaseShared`。

**工作流程（独占）：**

1. `acquire(arg)` → `tryAcquire(arg)` 尝试 CAS 获取 state。
2. 成功则返回；失败则 `addWaiter(Node.EXCLUSIVE)` 入队，`acquireQueued` 自旋 + park。
3. 前驱节点是 head 时再次 tryAcquire；否则 park。
4. 释放 `release(arg)` → `tryRelease` 改 state，unpark 后继节点。

**追问：**
- 追问1：AQS 为什么用 CLH 变种而不是原生 CLH？ → CLH 是自旋队列，AQS 改为阻塞（park/unpark）+ 双向队列，便于取消和共享模式传播。
- 追问2：state 为什么是 volatile？ → 多线程读写，保证可见性。修改用 CAS。
- 追问3：AQS 怎么实现公平/非公平？ → 非公平：tryAcquire 时直接 CAS 抢，不管队列有没有等待者；公平：先检查队列有没有前驱节点。

**代码示例（自定义不可重入锁）：**

```java
public class PlainLock {
    private final Sync sync = new Sync();

    public void lock() { sync.acquire(1); }
    public void unlock() { sync.release(1); }

    static class Sync extends AbstractQueuedSynchronizer {
        @Override
        protected boolean tryAcquire(int arg) {
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }
        @Override
        protected boolean tryRelease(int arg) {
            setState(0);
            setExclusiveOwnerThread(null);
            return true;
        }
    }
}
```

**常见误区：**
- 以为 AQS 是锁——它是同步器框架，不是锁。
- 以为 state 只能 0/1——Semaphore 可以是任意值。

**版本说明：** AQS 自 Java 5 JUC 引入。

---

### 4. ReentrantLock vs synchronized

**Q：ReentrantLock 和 synchronized 区别？**

**解答：**

| 维度 | synchronized | ReentrantLock |
|---|---|---|
| 实现 | JVM 关键字，monitor | JDK 类，基于 AQS |
| 可中断 | 不可中断 | lockInterruptibly 可中断 |
| 公平锁 | 非公平 | 可选公平/非公平 |
| 尝试获取 | 不支持 | tryLock(timeout) |
| 绑定条件 | 单条件（wait/notify） | 多 Condition |
| 释放 | 自动释放 | 必须 finally unlock |
| 性能 | Java 6+ 优化后接近 | 略灵活，高竞争下相当 |

**ReentrantLock 独有能力：**

1. **可中断获取锁**：`lockInterruptibly()`，等待锁时可响应中断。
2. **公平锁**：`new ReentrantLock(true)`，按线程请求顺序获锁，避免饥饿。
3. **tryLock 超时**：`tryLock(1, TimeUnit.SECONDS)`，超时返回 false。
4. **多 Condition**：一个锁可建多个等待队列，精确唤醒。

**使用注意：** 必须在 finally 中 unlock，否则死锁。

**追问：**
- 追问1：synchronized 为什么不能中断？ → monitorenter 是 JVM 指令，不支持中断；ReentrantLock 基于 AQS 的 park/unpark，可响应中断。
- 追问2：ReentrantLock 默认公平还是非公平？ → 非公平。非公平吞吐量高（新来线程可能直接拿到刚释放的锁，避免切换）。
- 追问3：Condition 比 wait/notify 好在哪？ → 多个条件队列，可以精确唤醒某一组等待线程，而不是 notifyAll 全部唤醒。

**代码示例：**

```java
ReentrantLock lock = new ReentrantLock();
Condition notEmpty = lock.newCondition();
Condition notFull = lock.newCondition();

lock.lock();
try {
    while (queue.isEmpty()) notEmpty.await();
    Object x = queue.poll();
    notFull.signal();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
} finally {
    lock.unlock(); // 必须！
}
```

**常见误区：**
- 忘记 finally unlock——锁泄漏。
- 以为 ReentrantLock 一定比 synchronized 快——Java 6 后 synchronized 优化很大，简单场景差不多。

**版本说明：** ReentrantLock 自 Java 5。

---

### 5. 线程池

**Q：线程池核心参数？执行流程？拒绝策略？如何合理设置线程数？**

**解答：**

**ThreadPoolExecutor 七大核心参数：**

1. **corePoolSize**：核心线程数（常驻）。
2. **maximumPoolSize**：最大线程数。
3. **keepAliveTime**：非核心线程空闲存活时间。
4. **unit**：时间单位。
5. **workQueue**：阻塞队列，存放待执行任务。
6. **threadFactory**：线程工厂（命名、优先级）。
7. **handler**：拒绝策略。

**执行流程：**

1. 线程数 < corePoolSize → 创建核心线程执行。
2. 核心线程满 → 任务入 workQueue。
3. 队列满 → 创建非核心线程（直到 maxPoolSize）。
4. 都满 → 触发拒绝策略。

**四种拒绝策略：**

- **AbortPolicy**（默认）：抛 RejectedExecutionException。
- **CallerRunsPolicy**：由提交任务的线程自己执行。
- **DiscardPolicy**：静默丢弃。
- **DiscardOldestPolicy**：丢弃队列最老任务，重试。

**如何设置线程数：**

- **CPU 密集型**（计算多）：线程数 = CPU 核数 + 1。过多线程上下文切换开销大。
- **IO 密集型**（DB/网络多）：线程数 = CPU 核数 × (1 + 平均等待时间/平均计算时间)。经验值 2N ~ 10N。
- **混合型**：拆分成 CPU 密集和 IO 密集两个线程池。

**为什么不建议用 Executors 工厂方法：**

- `newFixedThreadPool` / `newSingleThreadExecutor`：队列是无界 LinkedBlockingQueue，任务堆积 OOM。
- `newCachedThreadPool`：最大线程数 Integer.MAX_VALUE，可能创建大量线程 OOM。
- 生产中应手动 new ThreadPoolExecutor，明确队列和拒绝策略。

**追问：**
- 追问1：核心线程会被回收吗？ → 默认不会。`allowCoreThreadTimeOut(true)` 后核心线程空闲也会回收。
- 追问2：线程池预热？ → `prestartAllCoreThreads()` 启动时就建好核心线程，避免首次提交任务时延迟。
- 追问3：如何监控线程池？ → getActiveCount、getQueue().size、getCompletedTaskCount，配合 Micrometer/Prometheus。

**代码示例：**

```java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    8, 16,
    60L, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(100),
    new ThreadFactoryBuilder().setNameFormat("biz-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy()
);

pool.submit(() -> doWork());
pool.shutdown(); // 不接受新任务，等待已提交完成
```

**常见误区：**
- 用 Executors.newFixedThreadPool 生产——队列无界风险。
- 拒绝策略选择不当——默认 AbortPolicy 在高峰期抛异常，CallerRuns 反压提交方更友好。
- 不 shutdown 线程池——线程泄漏。

**版本说明：** JUC 自 Java 5；Java 9+ 的 `Executors` 增加了一些工厂方法但风险仍在。

---

### 6. ThreadLocal

**Q：ThreadLocal 底层实现？为什么会内存泄漏？InheritableThreadLocal 是什么？**

**解答：**

**底层结构：** 每个 Thread 对象内部有一个 `ThreadLocalMap threadLocals`。ThreadLocalMap 是定制 HashMap，key 是 ThreadLocal 对象（弱引用），value 是值（强引用）。

**工作机制：** 调用 `threadLocal.set(value)` 时，实际是拿到当前线程的 ThreadLocalMap，以当前 ThreadLocal 为 key 存入。get 同理。因此每个线程有独立副本，互不干扰。

**内存泄漏原因：**

- ThreadLocalMap 的 key 是**弱引用**，value 是**强引用**。
- ThreadLocal 对象如果外部没有强引用（如 `static` 但被回收，或局部变量），GC 时 key 被回收，value 仍被 Entry → ThreadLocalMap → Thread 链路强引用。
- 线程池里线程长期存活，这些 Entry 永远不会被访问，value 泄漏。

**为什么 key 用弱引用？** 如果 key 强引用，即使外部不再用 ThreadLocal，map 还持有它，ThreadLocal 本身无法回收。弱引用是为了让 ThreadLocal 本身可回收，但 value 仍泄漏。

**正确使用：** 用完 `threadLocal.remove()`，尤其在线程池场景。

**InheritableThreadLocal：** 子线程可以读取父线程设置的值。原理：创建子线程时，把父线程的 InheritableThreadLocalMap 复制一份到子线程。但线程池复用线程时，父子关系不成立（线程是提前创建的），需要 TransmittableThreadLocal（阿里 TTL）解决。

**追问：**
- 追问1：ThreadLocalMap 为什么用定制 HashMap 而不是 HashMap？ → key 是弱引用，且 hash 用 `threadLocalHashCode`（0x61c88647 黄金分割散列），冲突少；扩容阈值低。
- 追问2：ThreadLocal 真的线程隔离吗？ → 每个线程自己的 map，是隔离的。但父子线程、线程池复用需要注意。
- 追问3：为什么内存泄漏在线程池特别严重？ → 线程长期存活，Entry 不被清理。普通线程结束后 Thread 销毁，map 随之回收。

**代码示例：**

```java
private static final ThreadLocal<User> CTX = new ThreadLocal<>();

public void process(User user) {
    CTX.set(user);
    try {
        // 业务逻辑，任意地方 CTX.get()
    } finally {
        CTX.remove(); // 必须！
    }
}
```

**常见误区：**
- 不 remove——线程池场景内存泄漏。
- 把 ThreadLocal 当静态变量共享——它的设计是线程隔离。
- InheritableThreadLocal 用于线程池——不会自动传播，用 TTL。

**版本说明：** ThreadLocal 自 JDK 1.2；Java 8 提供 `ThreadLocal.withInitial()`。

---

### 7. CAS 与原子类

**Q：CAS 是什么？ABA 问题怎么解决？LongAdder 为什么比 AtomicLong 快？**

**解答：**

**CAS（Compare-And-Swap）** 是 CPU 级别的原子指令（x86 的 `lock cmpxchg`）。三个操作数：内存位置 V、预期值 A、新值 B。当 V == A 时，CPU 原子地把 V 更新为 B，否则不操作。整个过程硬件原子。

**原子类（AtomicInteger、AtomicLong 等）：** 内部用 volatile 变量 + CAS 循环。`i++` 变成 CAS 重试：读到当前值，CAS 更新为+1，失败则重读重试。

**ABA 问题：** 线程 1 读到 A，线程 2 把 A 改成 B 又改回 A，线程 1 CAS 成功——但值其实变过。某些场景（如栈顶指针）ABA 会导致错误。

**解决：版本号。** AtomicStampedReference 用 `(引用, 版本号)` 二元组，每次修改版本号+1。

**LongAdder（Java 8）：** 高并发下 AtomicLong 单点 CAS 竞争激烈。LongAdder 把 value 拆成 base + 一个 Cell 数组，不同线程 hash 到不同 Cell 各自累加。最后 `sum()` 时 base + 所有 Cell 相加。写操作分散，竞争小；读操作有精度损失（sum 时可能有并发修改），适合统计计数场景。

**追问：**
- 追问1：CAS 有什么缺点？ → 自旋开销（失败重试）、只能保证一个变量原子、ABA。
- 追问2：LongAdder 和 AtomicLong 怎么选？ → 低竞争 AtomicLong 即可；高并发统计（如 QPS）用 LongAdder。
- 追问3：AtomicReference 能做什么？ → 原子更新引用类型，配合 CAS 实现无锁数据结构。

**代码示例：**

```java
AtomicInteger cnt = new AtomicInteger(0);
cnt.incrementAndGet(); // CAS 自旋

// ABA 演示
AtomicStampedReference<Integer> ref = new AtomicStampedReference<>(1, 0);
ref.compareAndSet(1, 2, ref.getStamp(), ref.getStamp() + 1);
```

**常见误区：**
- 以为 CAS 无开销——高竞争下自旋浪费 CPU。
- 以为 ABA 总是问题——大多数场景值相同即可，只有"状态变化有副作用"时才需版本号。

**版本说明：** 原子类自 Java 5；LongAdder 自 Java 8。

---

### 8. 并发容器

**Q：ConcurrentHashMap 1.7 和 1.8 实现有什么区别？CopyOnWriteArrayList 原理？**

**解答：**

**ConcurrentHashMap 1.7（Segment 分段锁）：**

- 结构：Segment 数组（继承 ReentrantLock）+ 每个 Segment 内部是 HashEntry 数组+链表。
- 锁粒度：Segment。默认 16 个 Segment，理论上支持 16 线程并发写。
- get 无锁（volatile 读）。

**ConcurrentHashMap 1.8（CAS + synchronized）：**

- 去掉 Segment，改为 `Node[]` 数组 + 链表 + 红黑树（和 HashMap 类似）。
- 锁粒度细化到桶（Node）。
- 插入空桶用 CAS；桶非空用 synchronized 锁头节点。
- sizeCtl 控制初始化和扩容，支持多线程协助扩容。
- 并发度大幅提升（理论上每个桶一个锁）。

**CopyOnWriteArrayList：**

- 写时复制。读操作无锁，直接读数组。写操作加锁，复制一份新数组，修改后替换旧数组引用。
- 适合**读多写少**场景（如监听器列表、配置白名单）。
- 缺点：写开销大（每次复制整个数组）；实时性差（读可能读到旧数据）。

**追问：**
- 追问1：ConcurrentHashMap 1.8 为什么用 synchronized 而不是 ReentrantLock？ → synchronized 在 JDK 6 后优化很大，且锁头节点粒度更细，内存占用更小。
- 追问2：ConcurrentHashMap 能允许 null value 吗？ → 不能（HashMap 允许）。因为二义性：get(key) 返回 null 无法区分"key 不存在"还是"value 是 null"，并发下不能用 contains 区分。
- 追问3：CopyOnWriteArrayList 适合写多吗？ → 不适合。每次写都复制数组，写放大严重。

**代码示例：**

```java
Map<String, String> map = new ConcurrentHashMap<>();
map.put("k", "v"); // 1.8 CAS/synchronized

List<Integer> list = new CopyOnWriteArrayList<>();
list.add(1);       // 加锁 + 复制
Integer x = list.get(0); // 无锁读
```

**常见误区：**
- 以为 ConcurrentHashMap 完全线程安全——复合操作（put-if-absent、check-then-act）仍需外部加锁。
- 以为 CopyOnWriteArrayList 实时——读到的可能是旧快照。

**版本说明：** ConcurrentHashMap 1.7 Segment；1.8 CAS+synchronized；Java 8 新增 mappingCount 等。

---

### 9. 死锁

**Q：死锁的四个必要条件？如何避免？如何检测？**

**解答：**

**四个必要条件（同时满足才死锁）：**

1. **互斥**：资源同一时刻只能一个线程持有。
2. **持有并等待**：持有资源同时等待其他资源。
3. **不可剥夺**：资源只能持有者主动释放。
4. **循环等待**：线程间形成环形等待链。

**避免死锁：**

- 破坏循环等待：按固定顺序加锁（如所有线程都先锁 A 再锁 B）。
- 破坏持有并等待：一次性申请所有资源。
- 破坏不可剥夺：tryLock 超时放弃。
- 减少锁粒度、减少嵌套。

**检测：**

- `jstack <pid>`：输出会自动检测死锁，打印 "Found one Java-level deadlock"。
- JConsole / VisualVM：图形化检测。
- Arthas：`thread -b` 检测阻塞。

**追问：**
- 追问1：死锁和活锁区别？ → 活锁：线程不断重试但都失败（类似两人让路反复撞一起），不死但进展不了。
- 追问2：死锁和饥饿区别？ → 饥饿：线程长期得不到资源（如优先级太低），不一定死锁。
- 追问3：数据库死锁怎么处理？ → 数据库有死锁检测自动回滚一个事务；应用层保持一致顺序访问表。

**代码示例：**

```java
// 死锁示例
Object lockA = new Object(), lockB = new Object();

new Thread(() -> {
    synchronized (lockA) {
        synchronized (lockB) { ... }
    }
}).start();

new Thread(() -> {
    synchronized (lockB) {  // 顺序相反
        synchronized (lockA) { ... }
    }
}).start();
```

**常见误区：**
- 以为死锁一定会让程序崩溃——只是相关线程卡住，其他线程可能正常。
- 用 jstack 看不到生产死锁——jstack 会自动检测并打印。

**版本说明：** jstack 死锁检测自 JDK 5。

---

### 10. CountDownLatch / CyclicBarrier / Semaphore

**Q：这三个同步工具区别？使用场景？**

**解答：**

**CountDownLatch：**

- 一次性计数器。`new CountDownLatch(n)`，`countDown()` 减 1，`await()` 阻塞到 0。
- 不能重置。
- 场景：主线程等待 N 个并行任务完成后汇总。

**CyclicBarrier：**

- 可重置的屏障。`new CyclicBarrier(N)`，N 个线程都调用 `await()` 后同时放行，并可触发一个 barrierAction。
- 可复用（一轮结束后自动重置）。
- 场景：多线程计算，所有线程都到达屏障后合并结果。

**Semaphore：**

- 信号量，维护 N 个许可。`acquire()` 获取许可，`release()` 释放。
- 可做限流器（如只允许 10 个并发访问 DB）。
- 许可数可动态调整。

**对比：**

| 工具 | 计数 | 可重置 | 典型场景 |
|---|---|---|---|
| CountDownLatch | 倒计数到 0 | 否 | 等待 N 任务完成 |
| CyclicBarrier | 等待 N 线程到齐 | 是 | 多阶段计算 |
| Semaphore | 许可数 | 是（可释放） | 限流 |

**追问：**
- 追问1：CountDownLatch 和 CyclicBarrier 核心区别？ → 前者是一个线程等 N 个，后者是 N 个线程互相等；前者不可重置，后者可。
- 追问2：Semaphore 公平吗？ → 可选，默认非公平。
- 追问3：Semaphore 能做互斥锁吗？ → 可以，new Semaphore(1)，但不支持可重入。

**代码示例：**

```java
// CountDownLatch
CountDownLatch latch = new CountDownLatch(3);
for (int i = 0; i < 3; i++) {
    new Thread(() -> { work(); latch.countDown(); }).start();
}
latch.await(); // 等 3 个都完成

// CyclicBarrier
CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.println("全员到齐"));
for (int i = 0; i < 3; i++) new Thread(() -> {
    step1();
    barrier.await(); // 等其他线程
    step2();
}).start();

// Semaphore 限流
Semaphore sem = new Semaphore(10);
sem.acquire();
try { accessDB(); } finally { sem.release(); }
```

**常见误区：**
- CountDownLatch 复用——不能，要新建。
- Semaphore 当作可重入锁——它不跟踪持有线程。
- CyclicBarrier 所有线程都 await 后，barrierAction 在最后到达的线程上执行。

**版本说明：** 三者均自 Java 5 JUC。

---

> **全文完。** 以上为 Java 基础、JVM、并发与多线程三大模块共 30 个高频面试考点，建议结合源码（OpenJDK 8/11/17）与实际项目经验对照复习。

---

## 四、Go 基础
### 1. GMP 调度模型

**Q：请讲讲 Go 的 GMP 调度模型，G、M、P 分别是什么？调度流程是怎样的？**

**解答：**
GMP 是 Go 运行时（runtime）实现用户态协程调度的核心模型，三个角色各司其职：

- **G（Goroutine）**：用户态协程，是最轻量的执行单元。初始栈只有 2KB（可动态扩缩），创建成本远低于 OS 线程。
- **M（Machine）**：OS 线程，真正执行代码的"工人"。M 必须绑定一个 P 才能执行 G 队列里的任务。
- **P（Processor）**：逻辑处理器，是调度的"CPU 核心"，数量默认等于 `GOMAXPROCS`（通常等于核数）。P 持有一个本地可运行 G 队列（LRQ，Local Run Queue，容量 256），以及一些调度所需的上下文（mcache、当前 M 等）。

调度流程要点：
1. 新建 G 时，优先放入当前 P 的本地队列；本地队列满了（256 个），就把一半本地队列 + 新 G 一起"批量偷"给另一个空闲的 P（也叫 work stealing 的种子分发）。
2. M 执行循环：从当前 P 的 LRQ 取一个 G 运行；执行系统调用、channel 阻塞、锁等待时会触发调度。
3. **Work Stealing（工作窃取）**：当一个 P 的本地队列空了，它先从全局队列（GRQ）取一批（一次取 n/2 个），再去随机"偷"其他 P 本地队列一半的 G。
4. **Hand Off（交接）**：当 M 因为 G 陷入阻塞系统调用（如 read/write）而长时间挂起时，P 会与该 M 解绑，绑定到另一个空闲 M 上继续运行本地队列里的 G，避免队列里的任务被拖累。系统调用返回后，M 想继续执行 G，需要重新找空闲 P，找不到就把 G 放回全局队列，自己休眠。

设计上把调度权从 OS 手里拿回到用户态：上下文切换只需保存 PC、SP 等少量寄存器，没有陷入内核的开销；P 这一层的引入是为了减少全局锁竞争——早期模型只有 G 和 M，所有 G 放在全局队列，调度要拿一把大锁，P 的本地队列把大部分竞争消解掉了。

**追问：**
- 追问1：P 的数量和 M 的数量是什么关系？→ P 决定并行度（GOMAXPROCS），M 是 OS 线程，可以远多于 P。当大量 M 阻塞在系统调用时，runtime 会创建新的 M 去绑定这些 P，避免 P 饿死。M 有数量上限（默认 10000），P 数量上限 256。
- 追问2：G 阻塞在 channel/锁上，和阻塞在系统调用上，处理有什么不同？→ channel、mutex 这类"Go 语言内"的阻塞，会直接把 G 挂到对应等待队列，M 会去执行 P 上的其他 G，不需要新建 M；而系统调用阻塞会发生 hand off，因为 M 真的被内核挂住了，P 必须换个 M 才能干活。
- 追问3：什么是 Goroutine 泄漏？→ G 创建后永远得不到调度（比如 channel 永远没人写、WaitGroup 忘 Done、子协程引用了永不释放的资源），G 堆积不退出，内存和栈持续增长。常见于 context 没传取消、goroutine 里阻塞读一个永不关闭的 channel。

**代码示例：**
```go
// 查看 GOMAXPROCS，即 P 的数量
runtime.GOMAXPROCS(0) // 传 0 表示只读，不修改

go func() {
    // 一个 G：初始栈 2KB，创建约几微秒
    fmt.Println("hello from goroutine")
}()

// 故意制造阻塞系统调用，触发 hand off 观察（实际调优用 pprof）
```

**常见误区：** 以为 G 直接跑在 OS 线程上、数量等于核数；混淆 P 和 M，以为 P 数=线程数。实际上 M 可以远多于 P，P 只是"调度资源凭证"。

**版本说明：** GMP 模型自 Go 1.1 引入 P 后基本定型；Go 1.14 实现基于信号的异步抢占（解决长循环/循环中无函数调用点导致无法抢占、调度延迟抖动的问题）；Go 1.5 前栈初始为 8KB，之后为 2KB。

---

### 2. Channel 底层原理

**Q：Channel 的底层是怎么实现的？发送和接收是如何阻塞与唤醒的？关闭 channel 有哪些规则？**

**解答：**
Go 的 channel 在 runtime 层是一个 `hchan` 结构体，核心字段：

- `buf`：环形缓冲区（仅带缓冲 channel 才有）；
- `sendx` / `recvx`：环形队列的读写指针；
- `sendq`：等待发送的 G 队列（双向链表）；
- `recvq`：等待接收的 G 队列；
- `lock`：互斥锁；
- `closed`：是否已关闭。

工作机制：
- **无缓冲 channel**：`ch <- v` 时如果没有接收者等待，发送方 G 会被挂到 `sendq`；反之接收方没有数据时挂到 `recvq`。一旦有匹配方，数据直接从发送方拷贝给接收方（"握手"），缓冲区不参与。
- **带缓冲 channel**：`buf` 未满时，发送只是把数据拷进缓冲区就返回；满了才挂到 `sendq`。缓冲区有数据时，接收方直接取出；空了就挂到 `recvq`。
- **唤醒**：当有新接收者到来时，会从 `sendq` 队首唤醒一个等待发送的 G（直接把数据交给它）；反之新发送者到来时唤醒 `recvq` 里的等待者。被唤醒的 G 会被放回对应 P 的队列重新调度。

关闭 channel 的规则（极易考）：
1. 向已关闭的 channel **发送数据** → panic。
2. **关闭一个已关闭的 channel** → panic。
3. 关闭一个 `nil` channel → panic。
4. 从已关闭的 channel 接收：缓冲区数据读完后，继续接收会得到**零值**（不会 panic），`v, ok := <-ch` 中 `ok` 为 `false`。
5. 重复关闭、向 nil channel 发送/接收会永久阻塞（不 panic）。
6. 应该由**发送方**关闭 channel（接收方关闭会引发上面的 panic）；多个发送方时要额外用 sync.Once 或 sync.Pool 协调。

**追问：**
- 追问1：channel 是并发安全的吗？→ 是，内部有 mutex，所有读写操作都持锁。但这不代表用了 channel 就不会有数据竞争——channel 传递的是值拷贝，如果你传的是指针，多个 G 通过指针修改同一块内存仍然需要同步。
- 追问2：为什么 for range 读 channel 会自动退出？→ `for v := range ch` 编译后等价于不断 `<-ch`，当 channel 关闭且缓冲耗尽时，接收到零值且 `ok==false`，循环自动结束。
- 追问3：nil channel 有什么用？→ 在 select 中把某个 case 的 channel 设为 nil，可以禁用该分支（动态启用/禁用某个监听）。

**代码示例：**
```go
ch := make(chan int, 3) // 环形缓冲大小 3

// 关闭后读取：拿到零值，ok=false
close(ch)
v, ok := <-ch // v=0, ok=false
_ = v; _ = ok

// select 中用 nil channel 动态禁用分支
var send chan int = nil // 未初始化 = nil，发送会永久阻塞
select {
case x := <-ch:
    fmt.Println(x)
case send <- 1: // send 为 nil，此分支永远不可执行
}
```

**常见误区：** 误以为"关闭后再读会 panic"（实际只有写已关闭 channel 才 panic）；误以为 channel 关闭了就要靠发送方一直不写，忘了关闭后接收方会立即拿到零值。

**版本说明：** 结构自 Go 1.x 稳定；Go 1.14 后 channel 操作纳入异步抢占调度，延迟更稳定。

---

### 3. 内存逃逸分析

**Q：什么是内存逃逸？哪些场景会发生逃逸？逃逸对性能有什么影响？怎么查看？**

**解答：**
Go 的内存分为栈（stack）和堆（heap）。栈上的对象随函数返回自动回收，几乎零成本；堆上的对象需要 GC 管理。**逃逸分析（Escape Analysis）** 是编译器在编译期做的静态分析：判断一个对象的生命周期是否超出当前函数栈帧。如果"外面还有人引用它"，就必须分配到堆上，这就是**逃逸**。

典型逃逸场景：
1. **局部变量被返回指针引用**：函数返回局部变量的地址，调用方还在用，必须在堆上分配。
2. **变量太大或栈空间不足**：超过栈上连续分配阈值时直接走堆。
3. **变量类型不确定（interface 动态调用）**：把具体类型传给 interface 参数，编译器无法在编译期确定大小和调用方式，通常逃逸到堆（除非 devirtualization 成功）。
4. **闭包引用外部变量**：闭包会捕获变量，变量生命周期延长到堆。
5. **向 slice/map 中 append 可能触发扩容**：编译器无法预判容量时，元素可能逃逸。
6. **并发 goroutine 中使用的变量**：goroutine 退出时机不可控，编译器保守地把它放到堆。

性能影响：堆分配比栈分配慢几十到上百倍，且每次堆分配都增加 GC 扫描压力。高频路径上（如 RPC 热循环），一次不必要的逃逸可能造成可观的 CPU 和 GC 开销。

查看方法：`go build -gcflags="-m" ./...` 输出逃逸决策；`-m -m` 更详细。也可以用 `pprof` 的 alloc space 视角看实际堆分配热点。

**追问：**
- 追问1：返回指针一定逃逸吗？→ 在"编译器能证明调用方不再使用"时，通过 stack object 优化仍可留在栈。但实际业务代码中，返回指针基本都逃逸。
- 追问2：如何减少逃逸？→ 小对象传值而非传指针；避免 interface 传参（具体类型参数会做 devirtualize）；复用对象用 sync.Pool；关注 pprof 找热点。
- 追问3：逃逸是运行时行为吗？→ 不是，是**编译期**决定的。同一段代码编译后对象就固定在栈或堆上，不存在运行时动态决定。

**代码示例：**
```go
// 逃逸：p 被 return，堆分配
func newPoint() *int {
    x := 10
    return &x // x 逃逸到堆
}

// 不逃逸：直接传值
func square(n int) int { return n * n }

// interface 导致逃逸：s 作为 interface{} 参数
func log(v interface{}) { _ = v }
```

**常见误区：** 以为"只要返回指针就一定慢"——其实小对象在栈上分配本身成本极低，真正的成本是堆分配和 GC；也有人把"逃逸"理解成内存泄漏，二者完全无关（泄漏是"该回收没回收"，逃逸是"主动放到堆上"）。

**版本说明：** Go 1.x 持续优化逃逸分析与栈分配，Go 1.20+ 对闭包、defer 的栈分配有更多优化。

---

### 4. GC 垃圾回收

**Q：讲讲 Go 的 GC，三色标记法、写屏障、STW 分别在什么时候？**

**解答：**
Go 使用 **并发标记-清除（Concurrent Mark-Sweep）** 算法，目标是低延迟（不是高吞吐），STW 时间通常在亚毫秒级。

**三色标记法：**
- **白色**：待回收对象。
- **灰色**：已发现但子引用未扫描完的对象。
- **黑色**：本身和所有子引用都扫描完毕的对象。

过程：从 GC Roots（栈上变量、全局变量、寄存器）出发，初始把 root 标为灰色，然后反复：取出一个灰色对象，标黑，遍历它引用的对象标灰。结束时仍为白色的对象就是垃圾。

**为什么需要写屏障：** 并发标记期间，用户程序还在跑，可能出现"黑色对象新引用了一个白色对象，而该白色对象唯一引用链原本要被回收"的情况（漏标）。写屏障在"写指针"操作时插入一段钩子，保证这种情况下白色对象不会被误回收。

**混合写屏障（Hybrid Write Barrier，Go 1.8+）：** 结合了"删除屏障"和"插入屏障"的优点，规则可简化为：
1. 被删除的对象（即将不再被引用）标灰；
2. 新加入的引用指向的对象，如果在栈上被引用，需要重新扫描栈。
它的好处是：GC 期间栈不需要反复全部 STW 重扫，只在开、收尾时各做一次短 STW。

**STW 阶段（现代 Go）：**
1. **Mark Start（STW 1）**：开启写屏障，准备 root 扫描。极短（微秒级）。
2. **Concurrent Mark**：与用户 G 并发执行，占用部分 P（默认 25% CPU）。
3. **Mark Termination（STW 2）**：关闭写屏障，做收尾检查。也很短。
4. **Concurrent Sweep**：并发回收白色对象（懒清理，下次分配时顺手 sweep）。

**GC 调优：**
- `GOGC`（默认 100）：堆增长 100% 时触发 GC。调大减少 GC 频率、用内存换 CPU；调小更省内存但 GC 更频繁。
- `GOMEMLIMIT`（Go 1.19+）：软内存上限，接近时主动加压 GC，避免被 OOM Killer 杀掉，容器环境必设。
- 减少堆分配（见逃逸分析）、用 sync.Pool 复用对象，比调参数更有效。

**追问：**
- 追问1：Go GC 为什么不用分代？→ Go 的对象创建快、分配器精细，早期分代收益不明显；且并发回收 + 低延迟目标下，分代会增加复杂度。社区一直在讨论，未落地。
- 追问2：STW 为什么能做到毫秒级？→ 大部分工作并发做，STW 只做"开/关写屏障"这种小操作，不做全堆扫描。
- 追问3：GC 一定让程序变慢吗？→ GC 本身是 CPU 开销，但它是为了回收内存。GC 频繁说明分配多，真正该优化的是分配。

**代码示例：**
```go
// 运行时主动触发一次 GC（一般只用于测试，线上不要乱用）
runtime.GC()

// 容器环境推荐设置
// export GOMEMLIMIT=4GiB
// export GOGC=50
```

**常见误区：** 以为 Go 用引用计数；以为 STW 会扫描整个堆导致长时间停顿（现代 Go 已经把标记并发化）；以为 `runtime.GC()` 是性能优化手段。

**版本说明：** 三色标记+插入屏障在 Go 1.5 引入；混合写屏障 Go 1.8；`GOMEMLIMIT` Go 1.19；异步抢占 Go 1.14。

---

### 5. 并发安全与 sync 包

**Q：讲讲 sync.Mutex 的正常模式和饥饿模式，RWMutex、WaitGroup、Once、Pool 的原理和注意点。**

**解答：**
**Mutex**：本质是一个状态字（含锁位、饥饿标志、等待数）+ 一个 sema 信号量。抢锁失败的 goroutine 放入等待队列，通过信号量休眠/唤醒。

- **正常模式**：新到来的 G 会和被唤醒的等待者一起抢锁，新 G 刚在 CPU 上跑、CPU 缓存热，抢到的概率更大——这其实是一种"偏向新来者"的优化。缺点是可能造成老等待者长时间抢不到。
- **饥饿模式（Go 1.9+）**：如果一个等待者等待超过 1ms，Mutex 自动切到饥饿模式，锁直接按队列顺序交给队首 G，新来的 G 不参与竞争、直接入队尾。这样避免长尾延迟。当队首 G 拿到锁且它是最后一个等待者，或等待时间 <1ms，切回正常模式。

**RWMutex**：读锁共享、写锁排他。底层有 readerCount、readerWait（被写阻塞的读者数）、一个 Mutex。写优先级：写者到来时，阻止新读者进入（避免写者饿死），但已在临界区的读者跑完才写。

**WaitGroup**：内部计数 state（counter + waiter）。`Add(n)` 增加计数；`Done()` = Add(-1)；计数归零时唤醒所有 `Wait()` 者。注意 Add 必须在启动 goroutine 之前调用，否则 Wait 可能已经返回。

**Once**：保证函数只执行一次。内部有 done 标志 + Mutex。低竞争路径用 atomic 读 done，高竞争加锁。Go 1.20 修复了早期"函数 panic 也会标记 done"的语义问题（现在 panic 不算执行成功）。

**Pool**：对象复用池。两个级别缓存：private（每个 P 一个，无锁）和 shared（P 间共享，加锁）。Get 时先看 private，没有再从 shared 偷，再没有从其他 P 偷，最后调用 New 创建。**关键陷阱：每次 STW 时 Pool 会被清空**，所以 Pool 不能用来做长期缓存（如连接池），只适合复用"瞬时分配的临时对象"。

**追问：**
- 追问1：Mutex 能复制吗？→ 不能。复制会把锁状态一并复制，导致新实例上的 Unlock 操作错乱。go vet 会检查。
- 追问2：RWMutex 适合读多写少吗？→ 是，但写并发极高时反而可能比普通 Mutex 慢，因为维护读者计数有成本。
- 追问3：WaitGroup 能复用吗？→ 计数归零后可以重新 Add，但必须确保没有其他 Wait 在并发使用。

**代码示例：**
```go
var mu sync.Mutex
mu.Lock()
// 临界区
mu.Unlock()

var wg sync.WaitGroup
for i := 0; i < 5; i++ {
    wg.Add(1) // 必须在 go 之前 Add
    go func(n int) {
        defer wg.Done()
        _ = n
    }(i)
}
wg.Wait()

var once sync.Once
once.Do(initResource) // 只执行一次

var pool = sync.Pool{New: func() interface{} { return make([]byte, 1024) }}
buf := pool.Get().([]byte)
// ... 使用
pool.Put(buf) // 用完归还，但可能随时被 GC 清掉
```

**常见误区：** 把 sync.Pool 当连接池/缓存用（STW 清空会让你失望）；WaitGroup 在 goroutine 内部 Add；Mutex 按值传递。

**版本说明：** 饥饿模式 Go 1.9；Once 语义修正 Go 1.20；Pool 每 GC 清空的行为长期存在。

---

### 6. defer 机制

**Q：defer 的执行顺序是怎样的？defer 和 return 谁先谁后？闭包陷阱和参数预计算是什么？**

**解答：**
defer 用于注册一个函数调用，延迟到外层函数返回前执行。核心规则：

1. **LIFO（后进先出）**：多个 defer 按注册顺序入栈，执行时反过来。
2. **defer 先于 return 之后的"返回值写入"完成吗？** 准确说：Go 的 `return x` 不是原子操作，它分两步：(a) 给返回值赋值；(b) 执行 defer；(c) 真正把返回值交给调用方。所以 defer **能修改命名返回值**。
3. **参数预计算**：defer 注册时，参数就被求值并拷贝下来，不是执行时才算。
4. **闭包陷阱**：如果 defer 用闭包引用外部循环变量，所有 defer 闭包共享同一个变量，最终看到的都是循环结束后的值。

**追问：**
- 追问1：defer 会影响性能吗？→ 早期（Go 1.13 前）defer 要从堆分配 defer 链，有开销；Go 1.14 后大部分场景在栈上开放编码（open-coded defer），开销接近零。
- 追问2：defer 能修改返回值吗？→ 命名返回值可以；匿名返回值（`func f() int`）不行，因为 return 时已经把值拷贝走了。
- 追问3：for 循环里频繁 defer 有什么问题？→ defer 在函数返回时才执行，循环 N 次会攒 N 个 defer，可能撑大栈并延迟执行。资源释放应在循环内用匿名函数包裹，或用 try-finally 模式。

**代码示例：**
```go
// LIFO
func a() {
    defer fmt.Println(1)
    defer fmt.Println(2)
    defer fmt.Println(3)
}
// 输出：3 2 1

// 修改命名返回值
func f() (r int) {
    defer func() { r++ }()
    return 1 // 实际返回 2
}

// 参数预计算
x := 1
defer fmt.Println(x) // 打印 1，不是 100
x = 100

// 闭包陷阱
for i := 0; i < 3; i++ {
    defer func() { fmt.Println(i) }() // 全部打印 3
}
// 修复：把 i 作为参数传进去
for i := 0; i < 3; i++ {
    defer func(n int) { fmt.Println(n) }(i) // 打印 2,1,0
}
```

**常见误区：** 以为 defer 在 return 之后执行（实际是 return 的"写返回值"之后、"真正返回"之前）；以为 defer 参数是延迟求值。

**版本说明：** Open-coded defer Go 1.14 引入。

---

### 7. slice 底层原理

**Q：slice 的底层结构是什么？扩容策略是怎样的？append 有什么陷阱？**

**解答：**
slice 是对底层数组一段连续片段的引用，结构为：

```go
type slice struct {
    array unsafe.Pointer // 指向底层数组
    len   int            // 当前长度
    cap   int            // 容量（从 array 开始到数组末尾）
}
```

**扩容策略（Go 1.18 后调整）：**
- 老规则（Go 1.17 及以前）：cap < 1024 时翻倍；>=1024 时每次增 1.25 倍。
- 新规则（Go 1.18+）：小切片（<256）翻倍；大切片按公式 `newcap += (newcap + 3*256) / 4`，大约 1.25 倍起步并平滑过渡，避免过去从 2 倍突然变 1.25 倍的跳变。
- 实际还会经过内存对齐（roundupsize），所以最终 cap 经常比"理论值"略大。

**作为函数参数传递：** slice 本身是值拷贝，但拷贝的是"指针+len+cap"三元组。函数内部 append 如果没触发扩容，会改到底层数组（调用方可见）；如果触发扩容，底层数组重新分配，调用方的原 slice 不受影响。这是最经典的坑。

**append 陷阱：** 多个 slice 共享底层数组时，一个 append 改了底层数组，另一个也会被影响。

**追问：**
- 追问1：怎么避免共享底层数组的坑？→ 必要时 copy 一份，或使用 `s2 := append([]T(nil), s...)`。
- 追问2：nil slice 和 empty slice 区别？→ `var s []int` 是 nil（data 指针为 nil），`s := []int{}` 或 `make([]int, 0)` 是空 slice（指针非 nil 但 len=0）。JSON 序列化时 nil 变 `null`，空 slice 变 `[]`。
- 追问3：cap 有什么用？→ 预分配容量（`make([]T, 0, n)`）能显著减少扩容拷贝。

**代码示例：**
```go
a := []int{1, 2, 3}
b := append(a, 4)     // a 和 b 共享底层数组
_ = append(a, 999)    // 可能覆盖 b[3]！
fmt.Println(b)        // 取决于 cap，可能是 [1 2 3 999]

// 安全：预分配
s := make([]int, 0, 100) // 一次分配 100，循环里 append 不扩容
```

**常见误区：** 以为 slice 是"引用传递"；以为 append 后原 slice 会变；混淆 nil 和空 slice。

**版本说明：** 扩容策略 Go 1.18 调整。

---

### 8. map 底层原理

**Q：Go map 的底层结构？为什么遍历无序？为什么不是并发安全的？扩容怎么发生？**

**解答：**
Go 的 `map` 底层是 **hmap**（哈希表描述）+ 多个 **bmap**（bucket）。每个 bucket 固定 8 个 key/value 槽位，超过 8 个就用 overflow bucket 挂在后面（链表）。

流程：
1. 对 key 求哈希，高几位选 bucket，低位在 bucket 内定位槽位。
2. bucket 内部有一个 `tophash[8]` 数组，存每个 key 哈希的高 8 位，用来快速比对（免去逐个 key 做全量比较）。
3. key 和 value **分开存**（不像 C 那样紧凑排列），目的是对齐省内存。

**扩容（rehash）：**
- 触发条件：负载因子过高（默认 >6.5）或 overflow bucket 太多。
- 扩容分两种：same-size（翻倍 buckets 数量，把洪溢出的节点摊平）和 growing（两倍扩容）。
- **渐进式搬迁**：不是一次性搬完，而是每次写操作时"顺手搬 1~2 个 bucket"，并在 hmap 上记录 `oldbuckets`。读操作会同时查新旧两个表。这样避免一次性 STW。

**遍历无序：** 故意随机化起始 bucket 和起始槽位，保证不依赖遍历顺序。

**并发安全：** map 内部只有一个 mutex（Go 1.9+ 的 `sync.RWMutex` 在 hmap 上），但这把锁是给"并发读写直接报错"用的——runtime 检测到并发写会直接 fatal error。正确做法是用 `sync.Map`（读多写少、key 集合稳定）或自己加锁。

**追问：**
- 追问1：sync.Map 原理？→ 读用 atomic（read 字典无锁），写落到 dirty 字典；miss 多次后把 dirty 提升为 read。适合读远多于写且 key 集合稳定的场景。
- 追问2：map 的 key 有什么限制？→ 必须是可比较类型（不能是 slice、map、function）。
- 追问3：怎么预测 map 大小？→ `make(map[K]V, n)` 预分配 hint，避免运行时多次扩容。

**代码示例：**
```go
m := make(map[string]int, 100) // 预分配
m["a"] = 1
v, ok := m["a"] // comma-ok 写法，避免零值歧义
_ = v; _ = ok

// sync.Map 典型用法（读多写少）
var sm sync.Map
sm.Store("k", 1)
val, ok := sm.Load("k")
_ = val; _ = ok
```

**常见误区：** 并发读写 map 不会报编译错，运行时直接 panic/fatal；以为 map 遍历顺序固定。

**版本说明：** Go 1.9 引入 sync.Map；hmap 结构自 Go 1.0 基本稳定。

---

### 9. interface 与类型断言

**Q：Go 的 interface 底层是什么？iface 和 eface 区别？类型断言怎么实现？**

**解答：**
interface 在运行时表示为一个（type, value）二元组：

- **eface**：空 interface（`interface{}` / `any`），底层是 `_type` 指针 + 数据指针。
- **iface**：有方法的 interface，底层是 `itab`（含类型、方法表）+ 数据指针。itab 会缓存"某个具体类型是否实现了该 interface 的方法集"，避免每次都反射式遍历。

动态类型：接口变量里装的"具体类型"和"具体值"是两个概念。`var i interface{} = 42`，`i` 的动态类型是 `int`，动态值是 42。

**方法集规则（易错）：**
- 值类型 T：拥有 T 上定义的所有方法（包括值接收者和指针接收者？不——值类型只能调用值接收者方法）。
- 指针类型 *T：拥有 T + *T 上所有方法。
所以：如果一个接口方法用指针接收者实现，则只有 *T 能赋值给该 interface；值 T 不行。

**类型断言：**
```go
v := i.(T)         // 失败会 panic
v, ok := i.(T)     // 不 panic，ok=false 表示失败
switch v := i.(type) { ... } // 类型 switch
```
底层会检查 itab 的类型指针是否匹配 T，匹配则返回内部值。

**追问：**
- 追问1：interface{} 里放一个 nil 指针，i == nil 吗？→ **不相等**。因为 interface 的动态类型是 *xxx，即使动态值是 nil，interface 本身非 nil。这是经典坑。
- 追问2：怎么判断 interface 是否真为 nil？→ 需要动态类型和动态值都为 nil。
- 追问3：反射和接口关系？→ reflect.TypeOf(v) 本质上就是读取 interface 里的 _type 指针。

**代码示例：**
```go
type Speaker interface { Speak() string }
type Dog struct{}
func (d *Dog) Speak() string { return "woof" } // 指针接收者

// var s Speaker = Dog{} // 编译错误：Dog 没实现 Speaker（只有 *Dog 实现）
var s Speaker = &Dog{} // OK

// nil interface 陷阱
var p *Dog = nil
var i interface{} = p
fmt.Println(i == nil) // false！动态类型是 *Dog

// 安全断言
if v, ok := s.(*Dog); ok {
    _ = v
}
```

**常见误区：** 把 interface 当"万能指针"；忽略指针/值接收者对方法集的影响；interface 装 nil 指针时误判为 nil。

**版本说明：** Go 1.18 引入 `any` 作为 `interface{}` 别名；泛型（generics）Go 1.18 引入，与 interface 既有概念融合（comparable、constraints）。

---

### 10. context 原理

**Q：context 的作用是什么？WithCancel/WithTimeout/WithValue 怎么实现取消传递？为什么会内存泄漏？**

**解答：**
context.Context 是 Go 官方推荐的"请求域"上下文，用于跨 API 边界传递取消信号、超时和请求级元数据。

核心接口：
```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key any) any
}
```

实现家族：
- **context.Background() / TODO()**：根 context，不可取消，值为 nil。
- **WithCancel(parent)**：返回派生 ctx 和一个 cancel 函数。内部创建一个 cancelCtx，持有 children map。调用 cancel 时，关闭内部 done channel，并递归取消所有 children。
- **WithTimeout / WithDeadline**：在 WithCancel 基础上起一个 timer，到点自动调用 cancel。
- **WithValue**：返回一个 valueCtx，形成链式链表，`Value(key)` 沿父链向上查。

**取消传递机制：** 每个 cancelCtx 都有一个 `done chan struct{}`，第一次调用 cancel 时 close(done)，所有监听 `<-ctx.Done()` 的 goroutine 同时被唤醒。children 引用关系保证父取消能级联子取消。

**内存泄漏风险（高频考点）：**
1. **WithCancel/WithTimeout 不调用 cancel**：即使超时会自动触发，但如果提前返回，不显式 cancel 会导致子 context 一直挂在父节点的 children 里，直到父取消。文档明确要求"即使操作完成也要调用 cancel"。
2. **WithValue 链过长**：每次 WithValue 都新建一个节点，请求链路过长会累积小对象；更严重的是用 context 传业务参数（应显式传参），破坏可维护性。
3. **goroutine 里忘了监听 ctx.Done()**：请求超时后 goroutine 仍在跑，持有资源不释放。

**追问：**
- 追问1：context 能传值吗？→ 能，但只该传"请求域元数据"（traceID、认证 token），不要传业务参数。
- 追问2：WithTimeout 的 timer 怎么清理？→ 调用 cancel 会停掉 timer；不调用 cancel，timer 会到点触发，期间 timer 和关联 goroutine 一直占用。
- 追问3：同一个 ctx 传给多个 goroutine，cancel 后谁先停？→ close channel 同时唤醒所有接收者，没有顺序保证。

**代码示例：**
```go
func handler(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
    defer cancel() // 必须 defer，即使超时也会安全停 timer

    select {
    case <-time.After(5 * time.Second):
        return nil
    case <-ctx.Done():
        return ctx.Err() // context.DeadlineExceeded
    }
}

// WithValue 应只用于请求级元数据
ctx = context.WithValue(ctx, traceIDKey{}, "abc-123")
```

**常见误区：** 忘记 defer cancel；用 context 传业务参数；以为 cancel 可以重复调用（可以，多次调用安全，第二次起是 no-op）。

**版本说明：** context 包自 Go 1.7 引入；Go 1.21 提供 `ctx.After`、`ctx.Sleep` 等便捷方法（标准库实验）。

---

## 五、Redis
### 1. 数据结构与底层实现

**Q：Redis 常用数据类型的底层实现是什么？Redis 7.0 的 listpack 解决了什么问题？**

**解答：**
Redis 对外暴露 5 种常用类型（String/List/Hash/Set/ZSet），但底层会根据数据规模和元素特征切换编码（encoding），以兼顾内存和速度。

- **String / SDS（Simple Dynamic String）**：不是 C 字符串，而是带 len、alloc、flags 的结构体。O(1) 取长度、二进制安全（中间可以有 `\0`）、预分配空间减少 realloc、惰性释放。编码有 int（整数值用 long 存）、embstr（短字符串，sdshdr 与 redisObject 一次分配）、raw（长字符串，两次分配）。
- **List**：Redis 3.2 前是 ziplist + linkedlist；3.2~6.x 统一为 **quicklist**（双向链表 + 每个节点是 ziplist 块）；Redis 7.0 起用 **listpack** 替代 ziplist 作为 quicklist 节点。
- **Hash**：小数据量用 ziplist（key/value 紧挨压缩存储），超过阈值（hash-max-ziplist-entries=128、value<64B）转 hashtable。
- **Set**：纯整数且元素不多时用 intset（有序整数数组，二分查找）；否则用 hashtable。
- **ZSet**：小数据用 ziplist；大数据用 **skiplist + hashtable**（skiplist 负责范围/排序，hashtable 负责 O(1) 按 member 查 score）。

**为什么要有 listpack（Redis 7.0）：** ziplist 有个致命问题——**连锁更新（cascade update）**。ziplist 用 prevlen 记录前一个节点长度，这个字段是 1 字节或 5 字节变长编码。当某个节点长度从 <254 变成 >=254 时，prevlen 要从 1 字节扩到 5 字节，把后面的节点也"挤"长，引发下一个节点的 prevlen 又要扩……连锁反应可能 O(N)。listpack 改了设计：每个节点只记录自己的长度，不记录前一个节点长度，从根本上消除连锁更新。代价是反向遍历稍慢，但写友好。

**追问：**
- 追问1：跳表为什么不用红黑树？→ 实现简单、范围查询友好（按层遍历 O(logN) 找到起点再顺序走）、并发修改友好、内存可调（概率参数）。
- 追问2：SDS 为什么 O(1) 取 len？→ 结构体里直接存了 len 字段，不像 C 字符串要遍历到 `\0`。
- 追问3：embstr 和 raw 区别？→ embstr 一次内存分配把 redisObject 和 SDS 放一起，缓存友好；修改时立刻退化为 raw。

**代码示例：**
```bash
SET user:1001 "Alice"        # String
LPUSH queue task1 task2      # List
HSET user:1001 name Alice age 20  # Hash
SADD tags redis mysql        # Set
ZADD rank 100 alice 90 bob   # ZSet

OBJECT ENCODING user:1001    # 看底层编码：embstr / hashtable / listpack...
```

**常见误区：** 以为每种类型只有一种底层实现；以为 ziplist/listpack 省内存就无脑用——过大的压缩结构每次操作要重新编码，反而慢。

**版本说明：** quicklist Redis 3.2；listpack Redis 7.0 全面替换 ziplist；intset 长期存在。

---

### 2. 持久化机制

**Q：RDB 和 AOF 的区别？AOF 重写是什么？混合持久化为什么好？**

**解答：**
**RDB（Redis Database）**：二进制快照。在指定时间点把整个内存数据 dump 到磁盘。
- 触发：`save`（阻塞主进程）、`bgsave`（fork 子进程写）、配置规则（如 900 秒内 1 次写）。
- 优点：文件紧凑、恢复快、适合备份；
- 缺点：可能丢失两次快照之间的数据；fork 大实例时短暂阻塞。

**AOF（Append Only File）**：以日志形式记录每一条写命令，重启时重放。
- 刷盘策略：`always`（每条都 fsync，安全但慢）、`everysec`（每秒一次，最多丢 1 秒，默认）、`no`（交给 OS）。
- AOF 文件会越积越大，需要 **AOF 重写（rewrite）**：fork 子进程，根据当前内存状态生成"恢复同样数据集所需的最小命令集"，比如对同一个 key 改了 100 次，重写后只剩最终值。重写期间的新写命令同时写到旧 AOF 和重写缓冲区，结束时合并。

**混合持久化（Redis 4.0+）**：AOF 重写时，前半部分用 RDB 格式写当前快照，后半部分用 AOF 命令记录重写期间的增量。重启时先加载 RDB（快），再重放增量 AOF（准）。兼得 RDB 恢复速度和 AOF 数据安全。

**追问：**
- 追问1：fork 为什么会卡？→ Redis 是单线程，fork 时要复制页表。COW（写时复制）让父子进程共享物理页，但父进程继续写时会触发页复制，大内存实例 fork 慢且内存翻倍。
- 追问2：AOF 和 RDB 能同时开吗？→ 可以，推荐生产环境：混合持久化（aof-use-rdb-preamble yes，Redis 5.0 默认开启）。
- 追问3：AOF 重写会阻塞吗？→ 重写在子进程里做，主进程只处理正常请求和少量合并，但 fork 瞬间仍有短暂阻塞。

**代码示例：**
```conf
# redis.conf
save 900 1
save 300 10
appendonly yes
appendfsync everysec
aof-use-rdb-preamble yes   # 混合持久化
auto-aof-rewrite-percentage 100
```

**常见误区：** 以为 RDB 是实时备份；以为 AOF everysec 完全不丢数据（宕机仍可能丢 1 秒）。

**版本说明：** AOF Redis 1.1；混合持久化 Redis 4.0；默认开启 Redis 5.0。

---

### 3. 过期删除策略与内存淘汰

**Q：Redis 是怎么删除过期 key 的？内存满了有哪几种淘汰策略？**

**解答：**
**过期删除策略**：Redis 不会主动扫描所有 key，而是组合两种方式：

1. **惰性删除（lazy）**：访问 key 时检查 TTL，过期就删。优点是 CPU 友好；缺点是如果 key 一直不被访问，永远占内存。
2. **定期删除（periodic）**：每秒执行约 10 次（hz 配置），随机抽样一部分设了 TTL 的 key，删掉其中过期的；如果过期比例超过 25%，继续抽，直到比例降下来。这是一种概率性的"尽力而为"清扫。

两种策略组合：惰性保证访问路径不错杀，定期控制总量。

**内存淘汰策略（maxmemory-policy）**，当内存达到 `maxmemory` 上限：
1. **noeviction**（默认）：拒绝写，返回错误。
2. **allkeys-lru**：所有 key 中淘汰最久未使用的。
3. **allkeys-lfu**（Redis 4.0+）：按使用频率淘汰。
4. **volatile-lru**：只在设了 TTL 的 key 中按 LRU 淘汰。
5. **volatile-lfu**：同上但按 LFU。
6. **volatile-ttl**：优先淘汰 TTL 短的。
7. **volatile-random**：在设了 TTL 的 key 中随机淘汰。
8. **allkeys-random**：所有 key 随机淘汰。

生产最常用 **allkeys-lru**（或 allkeys-lfu）。LRU 在 Redis 中不是真链表，而是每个对象存一个 24-bit 的"时钟"，采样 N 个候选（默认 maxmemory-samples=5）选最旧的——近似 LRU。LFU 用 Morris 计数器做概率计数。

**追问：**
- 追问1：为什么不用严格 LRU？→ 维护双向链表在高并发下有锁开销；采样近似已足够。
- 追问2：设了 TTL 但内存没满，key 会怎样？→ 可能一直留着，直到被惰性访问或定期抽样抽到。
- 追问3：volatile-* 系列的问题？→ 如果设了 TTL 的 key 都"很重要"，可能没东西可淘汰但内存还在涨，导致写拒绝。所以一般用 allkeys-*。

**代码示例：**
```conf
maxmemory 4gb
maxmemory-policy allkeys-lfu
maxmemory-samples 10
```

**常见误区：** 以为过期 key 会被立即删除；混淆"过期删除"（TTL 到了删）和"内存淘汰"（内存满了删）。

**版本说明：** LFU Redis 4.0 引入。

---

### 4. 缓存三大问题

**Q：缓存穿透、击穿、雪崩分别是什么？怎么解决？**

**解答：**
**缓存穿透**：查询一个**数据库和缓存都没有**的 key，每次请求都打到 DB。常见攻击是伪造大量不存在的 ID。
- 解决：(1) 缓存空值（短 TTL，如 60s）；(2) 布隆过滤器（Bloom Filter）在请求前判断"这个 key 一定不存在"，挡在最前面；(3) 接口层做参数校验。

**缓存击穿**：某个**热点 key 突然过期**，瞬间成千上万请求同时打到 DB（"点破"缓存）。
- 解决：(1) **互斥锁**：发现缓存 miss 时，第一个请求去拿分布式锁，查 DB 并回填缓存，其他请求等一会儿再读；(2) **逻辑过期**：缓存不设物理 TTL，value 里存一个逻辑过期时间，发现逻辑过期时起异步线程回填，当前请求先返回旧值；(3) 热点 key 永不过期 + 后台定时刷新。

**缓存雪崩**：**大量 key 同时过期**，或 Redis 节点宕机，请求全部涌向 DB。
- 解决：(1) 过期时间加随机抖动（`TTL = base + random(0~300s)`），避免同批失效；(2) 高可用部署（主从+哨兵/Cluster），让缓存层本身不宕；(3) 服务层熔断降级，DB 扛不住时直接返回兜底；(4) 预热：上线前把热点数据提前加载。

**追问：**
- 追问1：布隆过滤器误判怎么办？→ 它说"存在"可能不准（误判），但说"不存在"一定不存在。所以适合挡穿透，不适合做唯一性校验。
- 追问2：互斥锁死锁怎么办？→ 给锁设 TTL，拿到锁的线程崩了也会自动释放；查询 DB 的线程要重试/超时。
- 追问3：缓存和 DB 双写一致性怎么保证？→ 常见策略：先更新 DB，再删缓存（Cache-Aside）；延迟双删；监听 binlog（Canal）异步删缓存。强一致场景用分布式锁或走 DB。

**代码示例：**
```go
// 互斥锁式击穿保护示例
func GetUser(ctx context.Context, id string) (*User, error) {
    if v, ok := cache.Get(id); ok {
        return v, nil
    }
    // 没命中，抢锁
    lockKey := "lock:user:" + id
    if !redis.SetNX(ctx, lockKey, 1, 5*time.Second).Val() {
        time.Sleep(100 * time.Millisecond) // 别人在重建，等一下重试
        return GetUser(ctx, id)
    }
    defer redis.Del(ctx, lockKey)

    u := db.QueryUser(id)
    cache.Set(id, u, 5*time.Minute+randomJitter()) // 加抖动
    return u, nil
}
```

**常见误区：** 把三个问题混为一谈；以为加了 Redis 就不会有雪崩（Redis 自身挂了也是雪崩源）。

**版本说明：** 通用方案，跨版本。

---

### 5. 主从复制与哨兵

**Q：主从复制的全量和增量流程？哨兵怎么选举和故障转移？脑裂是什么？**

**解答：**
**主从复制流程：**
1. **全量同步（full resync）**：从节点第一次连主节点时：
   - 从节点发送 `PSYNC ? -1`；
   - 主节点 `bgsave` 生成 RDB 快照给从节点；
   - 期间主节点把新写命令存入 replication buffer；
   - RDB 传完，把 buffer 中的增量命令也发给从节点；
   - 从节点加载 RDB + 重放增量，追上主节点。
2. **增量同步（psync）**：断线重连时，如果从节点记录的 replication offset 和主节点 replication ID 还对得上（在 repl backlog 缓冲区内），主节点只发缺失的那部分命令，不用全量。

**哨兵（Sentinel）：**
- 独立进程集群（建议 3 或 5 个，奇数），监控主从节点状态。
- **主观下线（SDOWN）**：一个 Sentinel 觉得主节点超时无响应。
- **客观下线（ODOWN）**：达到 quorum（多数派）个 Sentinel 都认为主观下线，才判客观下线。
- **领导者选举**：Sentinel 之间用 Raft 协议选出一个 leader，由它执行故障转移。
- **故障转移**：从现有从节点中挑一个"最优"的（按优先级、复制偏移量、runid 排序），执行 `REPLICAOF NO ONE` 提升为主；其他从节点指向新主；旧主恢复后变成从节点。

**脑裂（split-brain）：** 网络分区时，老主和从节点被隔开，但 Sentinel 集群在另一边选出新主。此时老主还在接客户端写——分区恢复后老主被降为从，未同步到新主的写就**丢失了**。解决：配置 `min-replicas-to-write 1` + `min-replicas-max-lag 10`，让主节点至少要有 N 个从节点在 10s 内有心跳，否则拒绝写——牺牲可用性换不丢数据。

**追问：**
- 追问1：为什么 Sentinel 要奇数个？→ Raft 多数派需要，3 个容忍 1 个故障，5 个容忍 2 个。
- 追问2：主从复制延迟怎么办？→ 半同步复制（Redis 主从本身没有 MySQL 那种半同步概念，靠 WAIT 命令阻塞等待 N 个从节点 ACK）、读请求走主或从本地缓存、业务容忍最终一致。
- 追问3：全量同步的 bgsave 会卡吗？→ 子进程 fork 时主进程短暂阻塞，大实例要警惕。

**代码示例：**
```conf
# sentinel.conf
sentinel monitor mymaster 10.0.0.1 6379 2   # quorum=2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 15000
```

**常见误区：** 以为哨兵本身能存数据（它只是监控/调度，不存业务数据）；以为主从同步是强一致。

**版本说明：** psync 2.8；复制流优化 4.0/5.0。

---

### 6. Redis Cluster

**Q：Redis Cluster 的哈希槽是怎么回事？为什么是 16384？节点间怎么做故障转移？**

**解答：**
Redis Cluster 用 **哈希槽（hash slot）** 做数据分片，而不是一致性哈希。共 **16384（2^14）个槽**，每个主节点负责一部分槽。

定位 key：`slot = CRC16(key) mod 16384`。

- 节点启动时通过 `CLUSTER NODES` 交换槽位分配信息，每个节点都知道"哪个槽在哪个节点"。
- 客户端打到错误节点时，节点返回 `MOVED` 重定向（永久重定向）或 `ASK` 重定向（迁移中的临时重定向）。
- 节点间用 **Gossip 协议**（二进制集群总线，端口 = 数据端口 + 10000）交换状态、心跳、故障判定。

**故障转移：**
- 每个主节点都有一个或多个从节点；
- 主节点宕机后，其他主节点通过 Gossip 投票（超过半数主节点同意），其从节点被授权提升为主；
- 提升后，槽位自动切换指向新主。

**为什么是 16384 而不是 65536？**（经典问题）
1. 节点心跳包通过 Gossip 传播槽位图，位图大小 = slots/8 字节。16384 bit = 2KB；65536 bit = 8KB。心跳包太大浪费带宽。
2. Redis 官方建议集群节点数不超过 1000，16384 槽已足够均匀分配。
3. 槽位太少（如 1024）扩容时数据迁移颗粒太粗，不均衡。

**数据迁移：** 槽可以从一个节点移到另一个节点，迁移过程中老节点对这个槽的请求返回 ASK，客户端临时去新节点问，直到迁移完成后老节点返回 MOVED，客户端更新路由表。

**追问：**
- 追问1：Cluster 能保证强一致吗？→ 不能。主从异步复制，主宕机时未同步给从的写会丢。
- 追问2：多 key 操作限制？→ 多 key 必须落在同一个槽（hashtag `{user1001}.name` 强制同槽），否则报错。
- 追问3：Cluster 支持事务/Lua 吗？→ 支持，但所有 key 必须在同一槽。

**代码示例：**
```bash
CLUSTER NODES
CLUSTER INFO
# 用 hashtag 让多 key 同槽
SET {user1001}.name Alice
SET {user1001}.age 20
```

**常见误区：** 以为 Cluster 用一致性哈希；以为 16384 是随便定的数字（是带宽与均衡的权衡）。

**版本说明：** Redis 3.0 正式 GA；后续版本逐步优化resharding、SSDB 等。

---

### 7. 事务与 Lua

**Q：Redis 事务 MULTI/EXEC 怎么用？为什么不支持回滚？Lua 脚本的原子性怎么保证？**

**解答：**
Redis 事务用 `MULTI` 开启，后续命令入队，最后 `EXEC` 一次性执行；`DISCARD` 放弃。

特点：
1. **隔离性**：EXEC 前命令只是入队，不会被其他客户端插入；EXEC 时顺序执行完，期间不会穿插其他客户端命令（单线程模型保证）。
2. **不支持回滚**：如果入队命令语法错（如命令名拼错），EXEC 直接拒绝执行所有；但如果运行时报错（如对 String 做 LPUSH），**错误命令执行失败，其他命令照常执行，不会回滚**。
3. **WATCH**：在 MULTI 前 `WATCH key`，如果 EXEC 前该 key 被其他客户端改过，整个事务放弃执行——相当于乐观锁。

**为什么不支持回滚？** Redis 作者的观点：运行时错误是编程 bug，应该在开发期发现；加回滚机制会拖慢性能、增加复杂度。

**Lua 脚本：** `EVAL "script" numkeys key... arg...`。Redis 把整个脚本作为一个原子单元执行：执行期间不会执行其他客户端的命令（单线程模型下天然原子）。脚本会被缓存（`EVALSHA`），适合把"读-判断-写"三步合成一次网络往返，减少 RTT。

典型场景：
- 库存扣减（GET + 判断 + DECR 合一）；
- 分布式锁的"检查-删除"原子化；
- 限流（INCR + EXPIRE 原子化，避免 INCR 后进程崩了没设过期）。

**追问：**
- 追问1：Redis 事务和 Lua 选哪个？→ Lua 更强大（可写逻辑、可复用），MULTI 更轻。新代码优先 Lua。
- 追问2：Lua 脚本太长怎么办？→ 用 `SCRIPT LOAD` 预加载，用 EVALSHA 调用；脚本要短，避免阻塞。
- 追问3：Redis 脚本阻塞了怎么办？→ `SCRIPT KILL`（没有写操作时）或 `SHUTDOWN NOSAVE`（有写操作时强制停）。

**代码示例：**
```redis
MULTI
SET k1 v1
INCR counter
EXEC

# WATCH 乐观锁
WATCH balance
GET balance
MULTI
DECRBY balance 100
EXEC

# Lua 原子扣库存
EVAL "local s=tonumber(redis.call('GET',KEYS[1])); if s<=0 then return 0 end; redis.call('DECR',KEYS[1]); return 1" 1 stock
```

**常见误区：** 以为 Redis 事务出错会回滚；以为 Lua 脚本有"事务"语义，其实它就是一段原子执行的代码。

**版本说明：** Lua 自 Redis 2.6；函数（Functions）Redis 7.0 引入，比脚本更可治理。

---

### 8. 分布式锁

**Q：怎么用 Redis 实现分布式锁？SETNX、Redlock、看门狗是什么？有什么争议？**

**解答：**
**基础版：SETNX + 过期时间**
```
SET lock:order:1001 unique_token NX PX 30000
```
- `NX`：key 不存在才设置，保证互斥；
- `PX 30000`：30s 自动过期，防止持锁进程崩溃后死锁；
- `unique_token`：每个客户端生成唯一值，释放时必须校验"锁是不是我加的"，避免误删别人的锁。

**释放锁的正确姿势（Lua 原子化）：**
```lua
if redis.call("GET",KEYS[1])==ARGV[1] then return redis.call("DEL",KEYS[1]) else return 0 end
```

**锁续期 / 看门狗（Watchdog）：** 业务执行时间不确定，固定过期时间可能导致"锁过期了业务还没跑完"。Redisson 等客户端在拿到锁后启动一个后台线程，每隔一段时间（默认锁 TTL 的 1/3，如 10s）检查持有者是否还活着，活着就把 TTL 续回 30s，直到业务主动释放或客户端宕机。

**Redlock 算法（Antirez 提出）：** 在多个独立 Redis 主节点上（比如 5 个）依次申请锁，只要在 N/2+1（3 个）节点上加锁成功且总耗时小于锁 TTL，就算加锁成功；否则向所有节点发释放。目的是解决"单主节点宕机、锁丢失"的问题。

**Redlock 的争议（Martin Kleppmann 批评）：**
- 算法依赖时钟；如果某个节点时钟跳变，可能出现两个客户端同时持锁。
- GC pause / 网络延迟下，客户端 A 持锁时间被拉长，超过 TTL 后 B 拿到锁，两边都以为自己持有锁。
- 更严谨的做法是用 fencing token（每次加锁拿到递增 token，资源侧拒绝旧 token 的写），Redis 本身不提供。
- 工程实践：大多数业务用单主 + 哨兵 + Redisson 已足够；强一致场景用 ZooKeeper/etcd（基于 consensus）更稳。

**追问：**
- 追问1：为什么释放锁要用 Lua？→ GET 和 DEL 之间如果锁过期被别人拿到，再 DEL 就删了别人的锁。Lua 把"比较+删除"合为原子。
- 追问2：锁粒度怎么定？→ 尽量细（按业务对象 ID 加锁），粗粒度锁会串行化吞吐。
- 追问3：Redlock 适合金融场景吗？→ 一般不推荐，用 etcd/ZK 更可靠。

**代码示例：**
```lua
-- unlock.lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
else
    return 0
end
```

**常见误区：** 用 `SETNX` 后忘记 `EXPIRE`（进程崩了死锁）；直接 `DEL` 不校验 token；以为 Redlock 是银弹。

**版本说明：** Redisson 看门狗是客户端实现；Redlock 算法 Redis 官方文档有详细描述。

---

### 9. 单线程模型

**Q：Redis 为什么单线程还这么快？Redis 6.0 多线程 IO 是什么？**

**解答：**
"Redis 单线程"指的是**命令执行是单线程**（事件循环里串行执行命令），而不是整个进程只有一个线程。它快的原因：

1. **纯内存操作**：所有数据在内存，纳秒~微秒级响应。
2. **IO 多路复用**：用 epoll/kqueue 同时监听成千上万连接，一个线程就能处理海量并发，避免线程切换和锁开销。
3. **数据结构高效**：跳表、哈希表、压缩列表都是为速度设计的。
4. **避免锁**：单线程执行命令天然没有竞争，不需要加锁。

**Redis 6.0 多线程 IO：**
- 命令执行仍是单线程；
- 把 **socket 读取、协议解析、socket 写回**这些 IO 操作分给多个线程做；
- 主线程只负责执行命令；
- 默认关闭，需要配置 `io-threads 4` + `io-threads-do-reads yes`。
- 收益主要在大流量、大报文场景（如 MS 级响应的实例）；小命令场景提升有限。

**哪些是多线程？**
- 后台异步删除（UNLINK、大 key 异步释放，lazyfree）；
- AOF fsync 线程；
- 主从复制 RDB 子进程；
- 重新哈希（rehash）的渐进式执行；
- Redis 6.0+ 的 IO 线程。

**追问：**
- 追问1：单线程怎么处理慢命令？→ 慢命令（如 `KEYS *`、大 HGETALL）会阻塞所有客户端。生产用 `SCAN`、`HSCAN` 分批；`slowlog` 排查。
- 追问2：Redis 6.0 之后还是"单线程"吗？→ 命令执行仍单线程；IO 多线程。整体"单线程模型"的核心没变。
- 追问3：为什么不用多线程执行命令？→ 多线程带来锁竞争、复杂度；Redis 瓶颈通常在网络和内存，不在 CPU。

**代码示例：**
```conf
io-threads 4
io-threads-do-reads yes
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
```

**常见误区：** 以为 Redis 6.0 把命令执行也多线程化了；以为单线程就不能利用多核（后台任务、IO 线程都在用多核）。

**版本说明：** 多线程 IO Redis 6.0；lazyfree 4.0/5.0。

---

### 10. 大 Key 与热 Key

**Q：什么是大 Key、热 Key？有什么危害？怎么发现和处理？**

**解答：**
**大 Key（Big Key）**：单个 key 的 value 过大——String 超过 10KB（业界经验阈值，更严格的是 1KB），List/Hash/Set/ZSet 元素数超过 5000。

危害：
1. **阻塞**：删除/修改大 key 是单线程操作，可能几十毫秒甚至秒级阻塞整个 Redis。
2. **网络拥塞**：一次 GET 传几 MB，挤占带宽。
3. **内存不均衡**：Cluster 中某个节点内存被少数大 key 撑爆。
4. **过期删除卡**：惰性删除时一次性 free 大量内存，阻塞。

**热 Key（Hot Key）**：访问量极高的 key（如秒杀商品、首页配置）。危害：单节点 CPU 被打满、网卡打满，成为集群瓶颈。

**发现方法：**
- 大 key：`redis-cli --bigkeys`（采样扫描）、`MEMORY USAGE <key>`、RDB 解析工具（redis-rdb-tools）；生产慎用 `--bigkeys`，它也是扫描。
- 热 key：`redis-cli --hotkeys`（需开启 LFU）、代理层（Twemproxy、Codis）统计、监控客户端访问频次、monitor（慎用，影响性能）。

**解决方案：**
- 大 key：(1) 拆分——大 Hash 拆成多个小 Hash（按用户 ID 分桶）；(2) 压缩 value；(3) 异步删除（`UNLINK` 代替 `DEL`）；(4) 本地缓存挡一部分。
- 热 key：(1) 多副本——把 key 复制成 `key_1`、`key_2`、`key_3`，客户端随机读一个；(2) 本地缓存（Caffeine）；(3) 读写分离，从节点分摊读；(4) 业务层降级。

**追问：**
- 追问1：为什么 UNLINK 能解决大 key 删除？→ 它只是把 key 从哈希表摘掉，实际内存释放放到后台线程做。
- 追问2：热 key 多副本会不会不一致？→ 用在"读多写少、容忍短暂不一致"的场景，写时同时更新所有副本。
- 追问3：怎么避免大 key 产生？→ 业务设计时就限制单 value 大小，List 只存 ID 不存对象，分页用 ZSet 而不是 LPOP 长 List。

**代码示例：**
```bash
redis-cli --bigkeys
MEMORY USAGE user:1001
UNLINK bigkey:xxx      # 异步删
```

**常见误区：** 以为大 key 只是"占内存"，忽略了它阻塞单线程的致命影响；用 `KEYS *` 扫全库找大 key（这是生产事故）。

**版本说明：** UNLINK 4.0；`--hotkeys` 需 maxmemory-policy 为 LFU。

---

## 六、MySQL
### 1. InnoDB 存储引擎架构

**Q：InnoDB 的整体架构？Buffer Pool、Change Buffer、Log Buffer 各自作用？刷脏机制是怎样的？**

**解答：**
InnoDB 架构分内存层和磁盘层：

**内存层：**
1. **Buffer Pool（缓冲池）**：以页（默认 16KB）为单位缓存磁盘数据页和索引页。所有读写都先经过 Buffer Pool。里面分 LRU 子链（young，热点）和 old（刚读入、可能被淘汰），用"中点插入"策略避免一次性全表扫描把热点冲掉。
2. **Change Buffer（写缓冲）**：当要修改的**二级索引页**不在 Buffer Pool 时，不立刻读磁盘，而是把变更记录到 Change Buffer。等这个页被其他读操作加载进内存时，再合并应用（merge）。目的是减少随机 IO——因为二级索引的修改往往是离散的，且很多页改完可能不再被读。**注意：聚簇索引不走 Change Buffer**（主键修改本身就要回表定位）。
3. **Log Buffer（日志缓冲）**：保存即将写入 redo log 的内存数据，按 `innodb_flush_log_at_trx_commit` 决定何时 fsync 到磁盘。

**磁盘层：**
- **系统表空间**（ibdata1）：数据字典、undo log、Change Buffer。
- **redo log**（ib_logfile*）：WAL 日志，循环写。
- **undo log**：回滚段，用于 MVCC 和回滚。
- **双写缓冲（Double Write Buffer）**：页先写到双写区再写真正的数据文件，避免"页断裂（partial page write）"——断电时一个 16KB 页只写了一半。

**刷脏机制：** Buffer Pool 里修改过的页叫"脏页"。后台 Page Cleaner 线程按规则把脏页刷回磁盘：
- 重做日志快写满时（async/sync flush 阈值）；
- Buffer Pool 空闲页不足；
- 系统空闲时；
- 正常 checkpoint。

**追问：**
- 追问1：为什么 Buffer Pool 要分 young/old？→ 防止一次性大批量读（如 dump）把热点数据挤出。新读入的页先放 old，被再次访问才晋升 young。
- 追问2：ChangeBuffer 什么时候 merge？→ 读取该页时、master thread 定期 merge、关闭数据库时。
- 追问3：Double Write 是不是多一次写？→ 是，但避免了页损坏后无法用 redo 恢复（redo 是按页应用的，页本身坏了 redo 也救不了）。

**代码示例：**
```sql
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW ENGINE INNODB STATUS;
```

**常见误区：** 以为 Change Buffer 缓存的是数据（它只缓存二级索引的变更）；以为刷脏是用户请求同步做的（主要是后台线程做，但 redo 写满会触发同步刷脏）。

**版本说明：** MySQL 5.7 / 8.0 架构一致；8.0 把 undo log 从系统表空间独立出来，支持 truncate。

---

### 2. 索引底层原理

**Q：为什么 InnoDB 用 B+ 树而不是 B 树/哈希？聚簇索引和二级索引的区别？什么是回表、覆盖索引、最左前缀、索引下推？**

**解答：**
**B+ 树结构：** 非叶子节点只存键和指针，不存数据；所有数据都在叶子节点，叶子节点用双向链表相连。
- 高度低：3~4 层就能存千万级数据（每层扇出几百到上千），一次查询 3~4 次磁盘 IO。
- 范围查询友好：找到起点后沿链表顺序扫即可。

**聚簇索引（Clustered Index）**：叶子节点直接存整行数据。一张表只有一个（通常是主键）。
**二级索引（Secondary Index）**：叶子节点存的是"索引列值 + 主键值"。查二级索引需要拿主键再回聚簇索引查一次整行——这叫**回表**。

**覆盖索引（Covering Index）**：如果查询需要的列都在二级索引里，就不用回表。`EXPLAIN` 里 `Extra: Using index`。

**最左前缀（Leftmost Prefix）**：联合索引 `(a, b, c)` 按 a→b→c 排序。查询条件必须从最左列开始连续匹配才能用上索引：`a=?`、`a=? AND b=?` 能用；`b=?` 用不上；`a=? AND c=?` 只能用 a。

**索引下推（Index Condition Pushdown, ICP, MySQL 5.6+）**：没有 ICP 时，存储引擎按索引找到满足"最左前缀"的记录就回表，然后 Server 层再过滤其他条件。有 ICP 时，把 `WHERE` 里"索引列上的剩余条件"下推到存储引擎层，在索引遍历时就过滤，减少回表次数。例如 `INDEX(name, age)`，`WHERE name LIKE '张%' AND age > 18`：没有 ICP 时所有姓张的都回表，有 ICP 时在索引上直接把 age<=18 的过滤掉再回表。

**追问：**
- 追问1：为什么不用哈希索引？→ 哈希只支持等值，不支持范围、排序、最左前缀；InnoDB 的自适应哈希索引（AHI）是内部自动建的，用户不能直接用。
- 追问2：为什么不用 B 树？→ B 树非叶子节点也存数据，单节点能放的键更少，树更高；B+ 树叶子链表对范围查询友好。
- 追问3：自增主键好还是 UUID 好？→ 自增主键：顺序插入，聚簇索引页不分裂、空间紧凑；UUID：随机插入导致页分裂、碎片、二级索引也存更大的主键。

**代码示例：**
```sql
CREATE TABLE user (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50),
  age INT,
  city VARCHAR(50),
  KEY idx_name_age (name, age)
);

-- 覆盖索引：不用回表
SELECT name, age FROM user WHERE name = 'Alice';

-- 索引下推：name LIKE 前缀 + age 过滤
SELECT * FROM user WHERE name LIKE '张%' AND age > 18;
```

**常见误区：** 以为索引列上用函数还能用上索引（`WHERE DATE(create_time)='2024-01-01'` 走不了索引）；以为联合索引顺序无所谓；以为 `SELECT *` 也能覆盖索引。

**版本说明：** ICP MySQL 5.6；降序索引、函数索引 MySQL 8.0。

---

### 3. 事务隔离级别与 MVCC

**Q：四个隔离级别分别解决什么问题？MVCC 怎么实现？undo log 版本链和 ReadView 是什么？**

**解答：**
**并发问题：**
- **脏写**：A 改了数据，B 也改了，A 回滚，B 的修改被回滚掉。
- **脏读**：A 读到 B 未提交的修改。
- **不可重复读**：A 两次读同一行，中间 B 提交了修改，两次结果不同。
- **幻读**：A 按条件读，B 插入了新行并提交，A 再读发现"多了一行"。

**四个隔离级别：**
| 级别 | 脏读 | 不可重复读 | 幻读 |
|---|---|---|---|
| 读未提交 RU | ✗ | ✗ | ✗ |
| 读已提交 RC | ✓ | ✗ | ✗ |
| 可重复读 RR（InnoDB 默认） | ✓ | ✓ | ✓（InnoDB 用 Next-Key Lock 部分解决） |
| 串行化 | ✓ | ✓ | ✓ |

**MVCC（多版本并发控制）**：通过为每行数据维护多个版本，让读不加锁、写不阻塞读。核心组件：
1. **隐藏列**：每行有 `trx_id`（最后修改它的事务 ID）、`roll_pointer`（指向 undo log 中上一个版本）。
2. **undo log 版本链**：每次修改都把旧值写进 undo log，形成链表。
3. **ReadView（读视图）**：读数据时生成的"快照"，包含：
   - `m_ids`：生成 ReadView 时活跃（未提交）的事务 ID 列表；
   - `min_trx_id`：m_ids 最小值；
   - `max_trx_id`：生成时应分配的下一个事务 ID；
   - `creator_trx_id`：当前事务自己的 ID。

**可见性判断：** 沿版本链找一个版本：
- 如果版本的 trx_id == creator_trx_id：自己改的，可见；
- 如果 trx_id < min_trx_id：修改它的事务在 ReadView 生成前已提交，可见；
- 如果 trx_id >= max_trx_id：修改它的事务在 ReadView 生成后才启动，不可见；
- 如果 min_trx_id <= trx_id < max_trx_id：若在 m_ids 中，说明还活跃（未提交），不可见；否则已提交，可见。

不可见就顺着 roll_pointer 找上一个版本。

**RC vs RR 的关键区别：**
- **RC**：每次 SELECT 都生成新的 ReadView，所以能看到其他事务新提交的修改（不可重复读）。
- **RR**：事务第一次 SELECT 时生成 ReadView，整个事务复用，所以可重复读。

**追问：**
- 追问1：MVCC 能完全解决幻读吗？→ RR 下普通快照读通过 ReadView 解决幻读；但当前读（`SELECT ... FOR UPDATE`）要靠 Next-Key Lock 防幻读。
- 追问2：RC 下能看到自己没提交的修改吗？→ 能，任何隔离级别都能看到自己的未提交修改。
- 追问3：ReadView 什么时候生成？→ RC：每条 SELECT；RR：事务内第一条 SELECT（不是 BEGIN 时）。

**代码示例：**
```sql
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
START TRANSACTION;
SELECT * FROM account WHERE id = 1;  -- 快照读，生成 ReadView
SELECT * FROM account WHERE id = 1 FOR UPDATE; -- 当前读，读最新版本并加锁
COMMIT;
```

**常见误区：** 以为 RR 完全解决了幻读（只对快照读有效）；以为 MVCC 是通过 undo log 直接存所有版本（undo log 是链式的，不是快照矩阵）。

**版本说明：** InnoDB 默认 RR 长期；MVCC 实现稳定。

---

### 4. 锁机制

**Q：InnoDB 有哪些锁？记录锁、间隙锁、Next-Key Lock 是什么？怎么加锁？死锁怎么检测？**

**解答：**
**按粒度：**
- **表锁**：整表加锁，开销小。DDL、`LOCK TABLES`、全表扫描时可能升级。
- **行锁**：只锁索引上的记录，开销大，并发高。InnoDB 的行锁是**加在索引上**的——如果查询没走索引，会退化为锁全表（实际是逐行加锁，等于全表锁）。
- **意向锁（Intention Lock）**：表级锁，声明"我接下来要在某些行上加 S/X 锁"。作用是让表锁判断"这表里有没有行被锁"时不用逐行检查。意向共享 IS、意向排他 IX，互相兼容。

**行锁三剑客（RR 级别下）：**
1. **Record Lock（记录锁）**：锁住索引上的一条记录。
2. **Gap Lock（间隙锁）**：锁住索引记录之间的开区间 `(a, b)`，不锁记录本身，目的是防幻读。间隙锁之间互不阻塞（只阻插入）。
3. **Next-Key Lock**：Record + Gap，左开右闭区间 `(a, b]`。InnoDB 默认用 Next-Key Lock，RR 级别下防幻读。

**加锁规则（简化版）：**
- 唯一索引等值查询命中：退化为 Record Lock。
- 唯一索引等值查询未命中：退化为 Gap Lock。
- 普通索引/范围查询：Next-Key Lock。
- `SELECT ... LOCK IN SHARE MODE` / `FOR UPDATE` 才加锁；普通 SELECT 是快照读不加锁。

**死锁：**
- 两个事务互相持有对方需要的锁，循环等待。
- InnoDB 有 **wait-for graph**（等待图）检测，发现环就回滚代价小的那个事务（死锁检测）。
- 也可设 `innodb_lock_wait_timeout` 超时。
- 预防：按固定顺序访问表和行；大事务拆小；为查询走索引避免表锁。

**追问：**
- 追问1：RC 级别有间隙锁吗？→ 没有。RC 下只有 Record Lock，所以 RC 会幻读，并发更好。
- 追问2：为什么行锁加在索引上？→ InnoDB 通过 B+ 树索引定位行，没有索引就只能全表扫描逐行锁，本质上等于表锁。
- 追问3：意向锁和行锁冲突吗？→ 意向锁之间兼容；表 X 锁和任何意向锁冲突。

**代码示例：**
```sql
-- 事务 A
BEGIN;
SELECT * FROM account WHERE id = 1 FOR UPDATE;

-- 事务 B 此时想更新 id=1 会阻塞
UPDATE account SET balance = balance - 100 WHERE id = 1;
```

**常见误区：** 以为 InnoDB 一定是行锁（不走索引时退化为表锁）；以为间隙锁锁的是记录（它锁的是区间）。

**版本说明：** Next-Key Lock 在 RR 下默认开启；RC 关闭。

---

### 5. redo log 与 undo log / binlog

**Q：redo log、undo log、binlog 分别是什么？两阶段提交是怎么回事？**

**解答：**
三种日志各司其职：

**redo log（InnoDB 引擎层，物理日志）**：记录"某页某偏移改成了什么值"。作用是崩溃恢复（crash recovery）——只要 redo 持久化了，即使宕机也能把已提交事务的修改重放出来。基于 WAL（Write-Ahead Logging）：先写日志，再写磁盘数据页，避免每次提交都随机写。

**undo log（InnoDB 引擎层，逻辑日志）**：记录"反向操作"（INSERT 的 undo 是 DELETE，UPDATE 的 undo 是旧值）。作用：(1) 事务回滚；(2) MVCC 版本链。

**binlog（Server 层，逻辑日志）**：记录所有写操作的逻辑（statement/row/mixed）。作用：主从复制、数据恢复（PITR）。

**两阶段提交（redo prepare → binlog → redo commit）：**
为什么需要？因为 redo log 是引擎层的，binlog 是 Server 层的，二者必须一致，否则主从会不一致。流程：
1. 准备阶段：InnoDB 写 redo log，状态设为 prepare；
2. 写 binlog（持久化）；
3. 提交阶段：InnoDB 写 redo log，状态设为 commit。

崩溃恢复时：
- 如果 redo log 是 commit 状态，直接提交；
- 如果是 prepare 状态，检查 binlog 是否完整（有 XID），完整就提交，不完整就回滚。
这样保证"binlog 写成功的事务一定在主库提交了"，主从一致。

**追问：**
- 追问1：为什么需要 WAL？→ 随机写磁盘慢，redo log 是顺序写；先记日志，后台慢慢刷脏页。
- 追问2：redo log 和 binlog 区别？→ redo 是物理日志、InnoDB 层、循环写；binlog 是逻辑日志、Server 层、追加写。
- 追问3：`innodb_flush_log_at_trx_commit=1` 和 `sync_binlog=1`？→ 两个都设 1 才是"事务提交绝不丢数据"，生产必设。

**代码示例：**
```sql
SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';
SHOW VARIABLES LIKE 'sync_binlog';
```

**常见误区：** 以为 redo log 是用来回滚的（那是 undo）；以为 binlog 是 InnoDB 的（它是 Server 层，所有引擎共用）。

**版本说明：** 两阶段提交机制长期稳定；MySQL 8.0 引入 binlog 事务压缩。

---

### 6. SQL 优化

**Q：怎么用 EXPLAIN 分析慢查询？JOIN 有哪些算法？常见优化手段？**

**解答：**
**EXPLAIN 关键字段：**
- `id`：查询序号，越大越先执行；相同则从上到下。
- `select_type`：SIMPLE / PRIMARY / SUBQUERY / DERIVED。
- `type`：访问类型，从好到差：`system > const > eq_ref > ref > range > index > ALL`。看到 `ALL`（全表扫描）和 `index`（全索引扫描）就要警惕。
- `key`：实际用的索引；`key=NULL` 表示没用索引。
- `rows`：预估扫描行数，越大越慢。
- `Extra`：
  - `Using index`：覆盖索引，好；
  - `Using where`：Server 层过滤；
  - `Using filesort`：额外排序，需优化；
  - `Using temporary`：用临时表（GROUP BY 常见），需优化。

**JOIN 算法：**
1. **Nested Loop Join（NLJ）**：驱动表每一行，去被驱动表查一次。被驱动表有索引时很快。
2. **Index Nested-Loop Join**：被驱动表走索引，最常见。
3. **Block Nested-Loop Join（BNLJ）**：被驱动表没索引时，把驱动表读到 join buffer，批量在被驱动表上比对。无索引时退化为 O(N*M)，很慢。
4. **Batched Key Access（BKA）**：MRR 优化，把多次索引查找合并成批量。

**常见优化手段：**
- 加合适的索引（覆盖索引、最左前缀）；
- 避免 `SELECT *`；
- 避免在索引列上用函数、隐式类型转换（`WHERE varchar_col = 123` 会把列转数字，索引失效）；
- `LIMIT` 分页深翻优化（`WHERE id > ? LIMIT 20` 代替 `LIMIT 100000, 20`）；
- 小表驱动大表；
- 拆分大事务、避免大 JOIN。

**追问：**
- 追问1：怎么定位慢 SQL？→ `slow_query_log = ON`，`long_query_time = 1`，用 `mysqldumpslow` 或 `pt-query-digest` 聚合。
- 追问2：索引失效的常见场景？→ 函数、隐式转换、`LIKE '%xxx'`、`OR` 两边没都索引、联合索引不满足最左。
- 追问3：深分页为什么慢？→ `LIMIT 100000, 20` 要扫描并丢弃前 100000 行。用游标（`WHERE id > 100000 LIMIT 20`）走索引。

**代码示例：**
```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 123 AND status = 'paid';

-- 优化前：深分页
SELECT * FROM orders ORDER BY id LIMIT 100000, 20;
-- 优化后：游标
SELECT * FROM orders WHERE id > 100000 ORDER BY id LIMIT 20;
```

**常见误区：** 看到 `type=range` 就以为没问题；用 `OR` 且其中一列无索引导致全表扫；JOIN 字段类型不一致导致隐式转换。

**版本说明：** EXPLAIN 长期；8.0 增加 `EXPLAIN ANALYZE`（实际执行并输出真实耗时）。

---

### 7. 主从复制

**Q：MySQL 主从复制流程？statement/row/mixed 三种 binlog 格式怎么选？复制延迟怎么解决？**

**解答：**
**复制流程：**
1. 主库把写事件写入 binlog；
2. 从库的 IO 线程拉取 binlog，写入本地 relay log（中继日志）；
3. 从库的 SQL 线程（MySQL 5.7 后是 worker 线程组，并行回放）重放 relay log。

**同步模式：**
- **异步复制**（默认）：主库写完 binlog 就返回，不等从库。主宕机可能丢数据。
- **半同步复制**（rpl_semi_sync）：主库提交后至少等一个从库 ACK binlog 收到才返回。在"持久性"和"性能"间折中。
- **全同步**：等所有从库执行完才返回，性能差，少用。

**binlog 格式：**
1. **statement（SBR）**：记录 SQL 原文。日志小，但 `NOW()`、`UUID()`、`LIMIT` 这种非确定性语句在从库可能重放出不同结果。
2. **row（RBR）**：记录每行的实际变更。日志大，但绝对准确。MySQL 5.7+ 默认。
3. **mixed**：默认 statement，遇到非确定性语句自动切 row。

**复制延迟原因与解决：**
- 主库并行写、从库单 SQL 线程回放（5.7 之前）→ 5.7 后基于 LOGICAL_CLOCK 并行回放；
- 大事务（一次改百万行）回放慢 → 拆小事务；
- 从库硬件差、慢查询 → 升级硬件、监控 Seconds_Behind_Master；
- 从库承担太多读流量 → 读写分离、缓存。

**追问：**
- 追问1：并行复制怎么做到？→ 5.6 按库并行；5.7 LOGICAL_CLOCK 按组提交并行；8.0 基于 WRITESET（行级 hash）并行度更高。
- 追问2：半同步超时怎么办？→ 配置 `rpl_semi_sync_master_timeout`，超时自动降级为异步。
- 追问3：复制中断怎么处理？→ `SHOW REPLICA STATUS` 看 Last_Error，跳过错误（`sql_slave_skip_counter`）或重修位点。

**代码示例：**
```sql
SHOW REPLICA STATUS\G
-- 看 Seconds_Behind_Source
SET GLOBAL binlog_format = 'ROW';
```

**常见误区：** 以为主从复制是强一致；以为 statement 模式更省（确实省日志，但正确性坑多）。

**版本说明：** MySQL 5.7 并行复制；8.0 WRITESET 并行、replica 术语替换 slave。

---

### 8. 分库分表

**Q：什么时候要分库分表？垂直拆分和水平拆分区别？分片策略？分布式 ID？扩容问题？**

**解答：**
**什么时候拆：** 单表数据量超过千万级、单库 QPS 达到瓶颈、单表索引/查询变慢、业务模块耦合严重。经验阈值：单表 > 2000 万行或 > 10GB。

**垂直拆分：**
- 垂直分库：按业务拆（用户库、订单库、商品库），解决业务耦合。
- 垂直分表：把大字段/不常用字段拆到扩展表，减少主表宽度。

**水平拆分：** 把同一表的数据按某种规则散到多个库/表，解决单表数据量。
- **分片策略：**
  - 范围分片（range）：按 ID/时间区间，易扩容但易热点（新数据都打到最新分片）。
  - 哈希取模（hash mod）：均匀，但扩容要 rehash（2 倍扩容时只迁移一半数据，一致性哈希改良）。
  - 一致性哈希：节点增减只影响相邻节点。
  - 查表/广播表：分片规则存在元数据表。

**分布式 ID：**
- UUID：无序，做主键导致页分裂；
- 数据库号段模式：一次取一段 ID（如 1000 个），内存分配；
- Snowflake：时间戳 + 机器 ID + 序列号，趋势递增；
- Redis INCR：简单但依赖 Redis；
- 美团 Leaf、百度 UidGenerator 是常见开源实现。

**跨库 JOIN：** 拆库后没法直接 JOIN。解决：(1) 冗余字段（空间换时间）；(2) 全局表（字典表每个库都存一份）；(3) 应用层组装；(4) ER 分片（关联数据按同一分片键存一起）。

**扩容问题：** 从 4 个分片扩到 8 个，哈希取模需要迁移 50% 数据。用一致性哈希或"翻倍扩容"（每个旧分片拆成两个新分片，按奇偶拆分）能减少迁移量。

**追问：**
- 追问1：分片键怎么选？→ 高离散度、查询高频字段、避免热点。常用 user_id、order_id。
- 追问2：分布式事务怎么办？→ 尽量避免跨分片事务；用最终一致（TCC、本地消息表、Saga）。
- 追问3：分库分表后全局唯一索引？→ 唯一索引（如用户名）需要额外的"映射表"或全局唯一 ID 生成器。

**代码示例：**
```sql
-- 按 user_id % 4 分 4 表
orders_0: user_id % 4 = 0
orders_1: user_id % 4 = 1
...
```

**常见误区：** 上来就分库分表（应该先尝试索引、读写分离、归档）；分片键选得不好导致数据倾斜；忽略跨分片事务代价。

**版本说明：** 中间件 ShardingSphere、Vitess 等社区方案，MySQL 8.0 本身无内建分片。

---

### 9. MVCC 实现细节

**Q：ReadView 到底什么时候生成？RC 和 RR 在 MVCC 上的具体差异？可见性判断的完整流程？**

**解答：**
这是第 3 题的深化，重点是把 ReadView 的生成时机和可见性算法讲透。

**ReadView 生成时机：**
- **RC**：**每一次 SELECT**（快照读）都生成一个新 ReadView。所以同一事务内两次 SELECT 之间，如果其他事务提交了，第二次 SELECT 能看到新数据——这就是不可重复读。
- **RR**：**事务内第一次快照读**时生成 ReadView，整个事务复用同一个。注意不是 `BEGIN` 时生成，是第一条 `SELECT` 时生成。如果 `BEGIN` 后先做了写操作，再 SELECT，ReadView 的生成时机又会受影响（写操作会让事务活跃得更早）。

**可见性判断完整流程：**
1. 取出当前数据行的 trx_id。
2. 如果 trx_id == creator_trx_id（自己改的）→ 可见。
3. 如果 trx_id < min_trx_id（ReadView 生成前已提交）→ 可见。
4. 如果 trx_id >= max_trx_id（ReadView 生成后才开始的事务）→ 不可见，沿 roll_pointer 找上一个版本。
5. 如果 min_trx_id <= trx_id < max_trx_id：
   - 若 trx_id 在 m_ids 中（生成 ReadView 时该事务还活跃）→ 不可见；
   - 否则（已提交）→ 可见。
6. 沿版本链重复，直到找到一个可见版本；全不可见则返回 NULL（行已被删除）。

**补充：当前读 vs 快照读**
- 快照读：普通 SELECT，走 MVCC。
- 当前读：`SELECT ... FOR UPDATE` / `FOR SHARE` / `UPDATE` / `DELETE`，读最新版本并加锁，绕过 MVCC。RR 下当前读看到的是"当前已提交的最新数据"，这就是为什么 RR 下"快照读可重复，但当前读可能看到新提交的数据"——配合 Next-Key Lock 防幻读。

**追问：**
- 追问1：为什么 RR 下第一次写后再读，ReadView 已经"旧"了？→ 因为写操作本身让事务 trx_id 进入活跃事务列表，ReadView 生成时机按实际首次 SELECT 算。
- 追问2：长事务为什么危害大？→ 长事务持有 ReadView，undo log 版本链不能被 purge（清理），导致 undo 膨胀、系统表空间暴涨。
- 追问3：purge 线程做什么？→ 清理不再被任何 ReadView 需要的 undo log 和已删除标记的行。

**代码示例：**
```sql
-- 事务 A（RR）
BEGIN;
SELECT * FROM t WHERE id = 1;  -- 第一次 SELECT，生成 ReadView
-- 此时事务 B 修改并提交 id=1
SELECT * FROM t WHERE id = 1;  -- 仍看到旧值（同一 ReadView）
SELECT * FROM t WHERE id = 1 FOR UPDATE; -- 当前读，看到 B 提交的新值并加锁
COMMIT;
```

**常见误区：** 以为 BEGIN 时就生成 ReadView；以为 RR 下所有读都看不到新提交（当前读能看到）；不理解长事务导致 undo 膨胀。

**版本说明：** InnoDB MVCC 实现跨 5.7/8.0 基本一致。

---

### 10. MySQL 8.0 新特性

**Q：MySQL 8.0 有哪些重要新特性？窗口函数、CTE、不可见索引、降序索引、原子 DDL 分别解决什么问题？**

**解答：**
**1. 窗口函数（Window Functions）**
在不折叠行的情况下做聚合。比如查询每个部门工资最高的员工：
```sql
SELECT name, dept, salary,
       RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rk
FROM employee;
```
之前要用变量、子查询、自连接，现在一句搞定。

**2. CTE（Common Table Expression，WITH 子句）**
支持非递归和递归 CTE：
```sql
WITH top_salary AS (
  SELECT dept, MAX(salary) AS max_s FROM employee GROUP BY dept
)
SELECT e.name, e.s FROM employee e JOIN top_salary t ON e.dept=t.dept;

-- 递归 CTE：查树形结构（菜单、组织架构）
WITH RECURSIVE org AS (
  SELECT id, name, parent_id FROM dept WHERE id = 1
  UNION ALL
  SELECT d.id, d.name, d.parent_id FROM dept d JOIN org o ON d.parent_id = o.id
)
SELECT * FROM org;
```

**3. 不可见索引（Invisible Index）**
索引对优化器"不可见"，但仍维护。用来灰度测试"删掉这个索引会不会影响性能"，出问题随时恢复可见。
```sql
ALTER TABLE t ALTER INDEX idx_name INVISIBLE;
```

**4. 降序索引（Descending Index）**
MySQL 5.7 以前语法支持 `DESC` 但被忽略，实际都是正序存储。8.0 真正支持降序存储，`ORDER BY x DESC, y ASC` 这种混合排序能用上索引。

**5. 原子 DDL（Atomic DDL）**
之前 DDL（如 `DROP TABLE`、`ALTER TABLE`）是"先写.frm、再拷贝数据"，中途崩溃会留下半成品。8.0 把数据字典统一到 InnoDB（之前是 frm 文件 + 内部字典两套），DDL 要么完成要么回滚，不会再出现"表删了一半"。

**其他重要特性：**
- **隐藏主键**：如果建表没指定主键，8.0 自动加一个 `ROW_ID` 隐藏主键（之前是共享的，并发插入有瓶颈）；
- **瞬时 DDL（Instant ADD COLUMN）**：8.0 支持 `ADD COLUMN` 不拷贝数据（8.0.12+），秒级加列；
- **并行复制 WRITESET**（5.7.22+，8.0 完善）；
- **Json 增强**：JSON 表达式、JSON_TABLE；
- **角色（Role）**：替代 grant 一堆用户。

**追问：**
- 追问1：为什么 8.0 之前降序索引是假的？→ B+ 树叶子是双向链表，正序反着扫也能倒序，但混合排序（一个升一个降）就没法用同一个索引。8.0 真正按 DESC 存储。
- 追问2：原子 DDL 解决了什么痛点？→ 5.7 删表中途崩溃，重启后表文件还在但数据字典没记录，只能手工修。8.0 不会。
- 追问3：Instant ADD COLUMN 的限制？→ 不能加主键列、不能加在第一列、全文/空间索引有限制；8.0.29 后进一步放开。

**代码示例：**
```sql
-- 窗口函数
SELECT name, dept, salary,
       ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) rn,
       LAG(salary, 1) OVER (PARTITION BY dept ORDER BY salary) prev_sal
FROM employee;

-- 不可见索引
CREATE INDEX idx_city ON user(city) INVISIBLE;
```

**常见误区：** 以为 8.0 只是"版本号升级"；忽略数据字典重做带来的升级风险（5.7 升 8.0 必须小版本升级，不能跨大版本直接 dump/restore）。

**版本说明：** 以上特性均为 MySQL 8.0.0+，部分（Instant ADD COLUMN）需 8.0.12+。

---

---

## 七、消息队列 MQ
### 1. MQ 的作用与主流产品选型

**Q：为什么要用消息队列？Kafka、RocketMQ、RabbitMQ、Pulsar 各自适合什么场景？**

**解答：** 消息队列在分布式系统中主要解决三类问题：

1. **解耦**：订单系统下单后不需要直接调用库存、物流、积分、通知等下游服务，只需发送一条"订单已创建"的消息，下游各自订阅消费。新增下游（如风控）时无需改动订单系统代码，避免了"上游依赖一堆下游、一个下游故障拖垮上游"的耦合。
2. **异步**：用户注册后，同步流程可能要写库、发短信、发优惠券、初始化画像，总耗时 800ms。引入 MQ 后，核心写库 50ms 返回，短信、优惠券等异步处理，接口 RT 显著下降，用户体验提升。
3. **削峰**：秒杀场景下瞬间 10w QPS 打到数据库会直接打挂。把请求先写入 MQ，后端消费者按数据库可承受的速率（如 2000 QPS）拉取消费，把瞬时流量"拍平"成平滑流量。

选型对比（2024 年主流版本）：

| 维度 | Kafka | RocketMQ | RabbitMQ | Pulsar |
|---|---|---|---|---|
| 语言 | Scala/Java | Java | Erlang | Java |
| 定位 | 日志/大数据流平台 | 业务消息/电商金融 | 企业级业务消息 | 云原生流消息 |
| 单机吞吐 | 百万级/s | 十万级/s | 万级/s | 百万级/s |
| 延迟 | ms 级 | ms 级 | μs 级 | ms 级 |
| 事务消息 | 支持较弱（Exactly-Once 语义在 Streams） | 原生支持半消息 | 不支持 | 支持 |
| 延迟消息 | 不支持原生 | 18 个等级/任意时间（5.x） | 插件实现 | 支持 |
| 消息回溯 | 按 offset | 按时间戳 | 不支持 | 按时间 |
| 消息堆积能力 | 极强（磁盘顺序写） | 强 | 弱（内存队列堆积快 OOM） | 强 |
| 社区/生态 | 大数据事实标准 | 阿里系电商首选 | 中小企业/中小团队 | 云原生新秀 |

**追问：**
- 追问1：Kafka 为什么吞吐能到百万级？→ 顺序写磁盘 + 页缓存（PageCache）+ 零拷贝（sendfile）+ 批量发送 + 分区并行，下面第 6 点详述。
- 追问2：RocketMQ 相比 Kafka 在业务场景上的核心优势是什么？→ 原生支持事务消息、延迟消息、消息回溯、死信队列、消息查询；Kafka 的 Topic 分区过多时性能下降明显，RocketMQ 单 Topic 可以承载海量队列而性能稳定。
- 追问3：RabbitMQ 为什么不适合大堆积？→ RabbitMQ 默认把消息存在内存（queue index），堆积多了会刷盘但性能急剧下降，甚至 OOM；Erlang 虚拟机的 GC 在万级队列时调度开销大。

**常见误区：** 认为"用了 MQ 就一定高性能"。实际上 MQ 引入了网络开销、持久化开销、运维复杂度，且带来一致性和可用性问题；只有在确实存在解耦、异步、削峰需求时才该用，不要为了用而用。

**版本说明：** 对比基于 Kafka 3.x、RocketMQ 4.9+/5.x、RabbitMQ 3.x、Pulsar 2.10+。

---

### 2. 如何保证消息不丢失

**Q：从生产者到 Broker 再到消费者，整条链路上如何保证消息不丢？**

**解答：** 消息丢失可能发生在三个环节，必须三端同时保障：

**生产者端**：生产者发送消息后，需要 Broker 明确确认（ACK）才认为发送成功。
- Kafka：设置 `acks=all`（或 `-1`），即 ISR 中所有副本都写入成功才算成功；配合 `retries=Integer.MAX_VALUE` 和 `enable.idempotence=true` 自动重试且不产生重复。
- RocketMQ：同步发送 `syncSend()`，并捕获失败后重试；事务消息则通过半消息 + 本地事务回查机制保证。
- RabbitMQ：开启 `publisher-confirms`（RabbitMQ 3.13 起统一为 publisher confirm），消息到达 Broker 并持久化后回调 ack；同时 mandatory 标志 + ReturnListener 处理路由不到队列的情况。

**Broker 端**：消息必须持久化到磁盘，且副本同步完成。
- Kafka：`unclean.leader.election.enable=false` 禁止非 ISR 副本当选 Leader，避免数据被截断；`replication.factor>=3`，`min.insync.replicas>=2`；磁盘配置 RAID 或使用云盘。
- RocketMQ：`flushDiskType=SYNC_FLUSH`（同步刷盘）而非 ASYNC_FLUSH；`brokerRole=SYNC_MASTER`（同步双写）而非 ASYNC_MASTER。同步刷盘/同步复制牺牲吞吐换来不丢。
- RabbitMQ：队列 `durable=true`、消息 `deliveryMode=2`（持久化）；镜像队列或 Quorum Queue（3.8+ 推荐）保证副本。

**消费者端**：必须处理完成后再 ACK。
- Kafka：关闭自动提交 `enable.auto.commit=false`，业务处理完成后手动 `consumer.commitSync()`。
- RocketMQ：默认集群消费模式下返回 `ConsumeConcurrentlyStatus.CONSUME_SUCCESS` 才算成功；返回 RECONSUME_LATER 会进入重试队列。
- RabbitMQ：`basicAck(deliveryTag, false)` 业务处理成功后手动确认；不要使用自动 ACK（autoAck=true）。

**代码示例（Kafka 生产者关键配置）：**
```properties
# 生产者：所有 ISR 副本确认才算成功
acks=all
retries=2147483647
enable.idempotence=true           # 幂等生产者，避免重试产生重复
max.in.flight.requests.per.connection=5  # 幂等下 <=5 仍可保序
linger.ms=10                      # 攒批
batch.size=16384
compression.type=lz4

# Broker 端
replication.factor=3
min.insync.replicas=2
unclean.leader.election.enable=false
```

**代码示例（Kafka 消费者手动提交）：**
```java
props.put("enable.auto.commit", "false"); // 关闭自动提交
consumer.subscribe(topics);
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
    for (ConsumerRecord<String, String> r : records) {
        process(r); // 业务处理
    }
    consumer.commitSync(); // 处理完再提交 offset
}
```

**追问：**
- 追问1：同步刷盘会不会严重影响性能？→ 会，大约损失 50%+ 吞吐。金融级业务（交易、支付）必须同步；日志类业务用异步刷盘即可，允许极端情况下丢少量数据。
- 追问2：acks=all 是否就 100% 不丢？→ 不是。若 ISR 中只剩 Leader 一个副本（follower 全部宕机），`min.insync.replicas=2` 会让生产者直接抛异常拒绝写入；但如果机器整机掉电且页缓存未落盘，仍会丢。绝对不丢需要多副本 + 跨机房 + 同步刷盘，成本极高。

**常见误区：** 只在某一端做保障就以为"消息不丢"。实际上只要任何一环（生产者没重试、Broker 异步刷盘、消费者自动 ACK）出问题，消息就可能丢。

**版本说明：** Kafka 3.x 中 `enable.idempotence=true` 隐含要求 `acks=all`；RocketMQ 5.x 推荐使用 POP 消费模式但手动 ACK 语义不变。

---

### 3. 如何保证消息顺序性

**Q：如何保证消息被顺序消费？全局有序和分区有序有什么区别？**

**解答：** 消息顺序性分为两个层次：

**全局有序**：一个 Topic 所有消息严格按生产顺序消费。实现方式：Topic 只设一个分区/一个队列，单线程消费。代价是完全失去水平扩展能力，吞吐极低，实际生产中几乎不用。

**分区有序（业务有序）**：只需要保证"同一业务 key"的消息被顺序消费。例如同一订单 ID 的"创建、支付、发货、签收"必须按顺序，但不同订单之间无需有序。实现方式：
- 生产者：相同 key 的消息路由到同一分区。Kafka 用 `partitioner.class` 对 key hash；RocketMQ 用 `MessageQueueSelector` 按 orderId 选队列。
- Broker：同一分区内消息天然有序（append-only log）。
- 消费者：同一分区只能被同一消费线程消费。Kafka 默认一个分区一个线程；RocketMQ 需要使用 `MessageListenerOrderly`，它会对每个队列加锁，单线程顺序消费。

**RocketMQ 顺序消息实现要点**：
- 生产者调用 `send(msg, selector, arg)`，selectMessageQueue 根据 arg（如 orderId）选择队列。
- 消费端 `MessageListenerOrderly` 内部对每个 MessageQueue 加分布式锁（基于 Broker 端的锁机制），同一队列的消息串行消费；消费失败会在当前队列重试，不跳到下一条，避免乱序。

**代码示例（RocketMQ 顺序消息）：**
```java
// 生产者：按 orderId 选队列
producer.send(msg, new MessageQueueSelector() {
    @Override
    public MessageQueue select(List<MessageQueue> mqs, Message msg, Object arg) {
        Long orderId = (Long) arg;
        int index = (int) (orderId % mqs.size());
        return mqs.get(index);
    }
}, orderId);

// 消费者：顺序监听
consumer.registerMessageListener(new MessageListenerOrderly() {
    @Override
    public ConsumeOrderlyStatus consumeMessage(...) {
        process(msgs); // 单线程顺序处理
        return ConsumeOrderlyStatus.SUCCESS;
    }
});
```

**追问：**
- 追问1：Kafka 多分区下如何保证顺序？→ 同 key 路由到同分区，且 `max.in.flight.requests.per.connection=1`（旧版）或开启幂等（新版可保留并发）。注意：如果重试时前一批失败后一批成功，仍可能乱序；幂等生产者 + `enable.idempotence=true` 可解决。
- 追问2：RocketMQ 顺序消费卡住了怎么办？→ 顺序消费失败默认在当前队列重试 16 次（间隔递增），仍失败才进入死信队列。这期间该队列被阻塞，相当于局部不可用——这是顺序性与可用性的权衡。
- 追问3：全局有序有什么替代方案？→ 按业务 key 分区有序，把"全局"拆解成"每个 key 内有序"，是工业界标准做法。

**常见误区：** 认为"Kafka 是顺序的"。Kafka 只保证单分区内有序，跨分区完全无序；消费者多线程拉取同一分区也会乱序。另外，rebalance 后分区换了 leader 或消费者，可能出现短暂重复，需要幂等。

---

### 4. 消息重复消费与幂等性

**Q：为什么会重复消费？消费端如何保证幂等？**

**解答：** 消息队列的语义通常是 **At-Least-Once（至少一次）**，重复消费是常态而非异常。重复来源：
1. 生产者重试：网络抖动后超时未收到 ACK，重发导致 Broker 端有两条相同消息。
2. Broker 故障：消费者已处理但 offset 未提交（如 Rebalance 发生），下次重新拉到。
3. 消费者重启：处理完成、提交 offset 前崩溃。
4. 运维误操作：重置 offset 重新消费。

因此，**消费端必须自己保证幂等**，不能依赖 MQ 不重复。常见幂等方案：

1. **唯一消息 ID + 去重表**：每条消息带全局唯一 ID（如 UUID/雪花 ID），消费前先查"已消费消息表"，存在则跳过；不存在则在本地事务中"写业务数据 + 写去重记录"一起提交。
2. **数据库唯一键**：利用业务表唯一索引，如订单号唯一，重复 INSERT 会失败从而保证不重复入账。
3. **状态机**：订单状态只能从"待支付→已支付→已发货"，重复收到"已支付"消息时校验当前状态，若已是"已发货"则忽略。
4. **Redis SETNX**：`SET msgId 1 NX EX 86400`，设置成功才消费，失败说明已处理。性能高但有 Redis 宕机窗口，适合非核心链路。

**代码示例（Redis + 唯一 ID 幂等）：**
```java
public ConsumeConcurrentlyStatus consume(MessageExt msg) {
    String msgId = msg.getMsgId();
    // SETNX：key 存在则不重复执行；TTL 与业务允许的重复窗口一致
    Boolean firstTime = redis.opsForValue()
        .setIfAbsent("mq:idem:" + msgId, "1", 24, TimeUnit.HOURS);
    if (Boolean.FALSE.equals(firstTime)) {
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS; // 已处理，直接 ack
    }
    try {
        bizService.handle(msg);
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
    } catch (Exception e) {
        redis.delete("mq:idem:" + msgId); // 失败则删 key，允许重试
        return ConsumeConcurrentlyStatus.RECONSUME_LATER;
    }
}
```

**追问：**
- 追问1：Kafka 的 Exactly-Once 实现？→ Kafka 0.11+ 提供幂等生产者（PID+序列号去重单分区）和事务（跨分区原子写），配合消费端"read-process-write"在事务内完成，可实现精准一次。但这仅限 Kafka Streams 内部流处理，跨系统业务仍需自己幂等。
- 追问2：去重表方案性能如何？→ 每条消息一次 SELECT + INSERT，高吞吐场景是瓶颈。常用优化：Redis 做一级过滤，DB 做二级兜底；或者只用业务唯一键（如订单号），不额外存 msgId。
- 追问3：先提交 offset 再处理业务 vs 先处理再提交？→ 必须先处理业务再提交 offset。反过来会导致消息处理失败但 offset 已提交，消息永久丢失。

**常见误区：** 以为"开了生产者幂等就不会重复消费"。生产者幂等只防止单分区内重试产生重复，跨分区、跨会话、消费者 Rebalance 导致的重复它管不到。

---

### 5. 消息积压处理

**Q：线上突然出现大量消息积压，如何紧急处理？**

**解答：** 先定位积压原因，再分类处置。

**常见原因：**
- 消费者宕机或发布后 BUG（如死循环、DB 慢 SQL），消费速率骤降。
- 下游依赖（DB、Redis、HTTP 服务）变慢，RT 升高。
- 生产流量突增（活动、爬虫、重试风暴）。
- 消费者 Rebalance 频繁，或分区数远少于消费者线程数。

**紧急处置步骤：**
1. **先监控定位**：看 Topic 的 lag（Kafka `kafka-consumer-groups.sh`）或 RocketMQ 控制台，确认积压量、消费 TPS、生产 TPS、消费者实例数、CPU/GC/下游 RT。
2. **如果是消费者 BUG/下游故障**：先回滚版本或修复下游，不要盲目扩容——下游 DB 已经慢了，加消费者只会把 DB 压垮。
3. **如果是消费能力不足**：
   - 横向扩容消费者实例数（注意：实例数不能超过分区数，否则多余实例空闲）。
   - 临时增加分区数（Kafka 可以改，但会破坏同 key 有序性；RocketMQ 可以临时写新队列）。
   - 提高消费线程数（RocketMQ `consumeThreadMax`），但要评估下游承载。
4. **应急方案：临时转发**：写一个临时程序，把积压 Topic 的消息转发到一个新的 Topic（分区数扩 3-10 倍），新 Topic 起大量消费者并行消费，消费完再切回。
5. **监控告警常态化**：设置 lag 阈值（如 10w 或滞后时长 > 5min）告警，不要等用户投诉才发现。

**代码示例（查看 Kafka 积压）：**
```bash
kafka-consumer-groups.sh --bootstrap-server broker:9092 \
  --describe --group order-consumer-group
# 输出关注 LAG 列：CURRENT-OFFSET / LOG-END-OFFSET / LAG
```

**追问：**
- 追问1：积压几十万小时后还能消费吗？→ 取决于 Broker 保留策略。Kafka `retention.ms` 默认 7 天，超过会被删除；RocketMQ 默认保留 72 小时。所以积压要尽快处理，超时消息会丢失。
- 追问2：扩容消费者为什么不能超过分区数？→ Kafka 一个分区同一时刻只能被消费组内一个线程消费，分区数是并行度上限。要扩并行度必须先扩分区。
- 追问3：消费太慢时能否跳过非关键消息？→ 对日志/埋点类可直接重置 offset 到最新（`seekToEnd`）；对业务消息（订单、支付）不能跳，必须追完。

**常见误区：** 积压了第一反应是"重启消费者"。重启只会让情况更糟（Rebalance、重新拉取），且不能解决根因。正确做法是先监控、再定位、后扩容。

---

### 6. Kafka 架构与高吞吐设计

**Q：Kafka 为什么吞吐这么高？它的整体架构是怎样的？**

**解答：** Kafka 架构由 Producer、Broker、Consumer、ZooKeeper/KRaft、Topic、Partition、Replica 组成。一个 Topic 分为多个 Partition，分布在不同 Broker 上；每个 Partition 有多个 Replica（1 个 Leader + 若干 Follower），Leader 处理读写，Follower 同步数据。ISR（In-Sync Replicas）是与 Leader 保持同步的副本集合。

高吞吐的六大设计：

1. **顺序写磁盘**：Partition 是 append-only log，消息只追加不随机改。磁盘顺序写吞吐量可达 600MB/s，远高于随机写（100MB/s）甚至部分内存随机写。
2. **页缓存（PageCache）**：Broker 写消息先写入 OS PageCache，由 pdflush 异步刷盘；消费者读消息直接命中 PageCache，无需访问磁盘。Kafka 几乎不在 JVM 堆里缓存消息，避免了 JVM GC 对大堆的压力。
3. **零拷贝（sendfile）**：消费者拉取消息时，数据从磁盘→PageCache→内核 socket buffer→网卡，全程不经过用户态，避免了四次拷贝和两次上下文切换。对比传统 read+write 的四次拷贝+四次切换。
4. **批量处理**：生产者默认攒批（`linger.ms`、`batch.size`），Broker 端按 segment 文件批量刷盘，网络请求也是批量的，大幅降低网络和磁盘 IO 次数。
5. **分区并行**：Topic 拆成多 Partition，分布在多 Broker，生产者写、消费者读都可以并行。
6. **稀疏索引**：每个 segment 文件配一个 offset 索引文件和时间戳索引文件，稀疏存储，按 offset 二分定位到物理位置后顺序扫描。

**追问：**
- 追问1：ISR 是什么？OOM 了怎么办？→ ISR 是"与 Leader 同步进度差距在阈值内"的副本集合（`replica.lag.time.max.ms`，默认 30s）。Follower 落后超时会被踢出 ISR；`unclean.leader.election.enable=false` 时，非 ISR 副本不能当 Leader，保证不丢数据但牺牲可用性。
- 追问2：Leader 选举怎么进行？→ ZooKeeper 时代依赖 ZK 选 controller，controller 负责选 partition leader；KRaft（Kafka 2.8+ 引入，3.x 生产可用）用 Raft 协议管理元数据，去掉了 ZK 依赖。
- 追问3：为什么不把消息放 JVM 堆里？→ 堆内缓存几 TB 消息会让 Full GC 停顿秒级，且 JVM 对象头开销大。直接利用 OS PageCache 更高效。

**代码示例（Broker 关键配置）：**
```properties
num.network.threads=8          # 网络线程
num.io.threads=16               # IO 线程
log.segment.bytes=1073741824    # 1GB 一个 segment
log.retention.hours=72         # 保留 3 天
log.cleanup.policy=delete      # delete 或 compact
num.recovery.threads.per.data.dir=2
```

**常见误区：** 认为"Kafka 快是因为用内存"。实际它是**借用 OS 内存 + 顺序磁盘 + 零拷贝**的组合，不是堆内缓存。另外，分区数并非越多越好——分区过多会增加 Leader 选举时间、文件句柄、元数据压力，单 Broker 分区数建议不超几千。

**版本说明：** KRaft 模式在 Kafka 3.3 标记 production ready，3.5 后 ZK 模式进入 deprecation；4.0 起移除 ZK。

---

### 7. Kafka 消费者组与 Rebalance

**Q：Kafka 消费者组的分区分配策略有哪些？Rebalance 什么时候发生？如何避免频繁 Rebalance？**

**解答：** 消费者组（Consumer Group）内所有消费者共同订阅一个 Topic，每条消息只会被组内一个消费者消费。分区分配策略：

- **RangeAssignor**（默认）：按分区范围分给每个消费者，可能出现分区不均。
- **RoundRobinAssignor**：轮询分配，较均匀。
- **StickyAssignor**：尽量保持原有分配，Rebalance 时变动最小。
- **CooperativeStickyAssignor**（2.4+）：增量协同 Rebalance，只重分配需要变动的分区，不需要 Stop-The-World。

**Rebalance 触发条件：**
1. 组成员数变化：消费者加入、宕机、主动离开。
2. 订阅的 Topic 分区数变化。
3. 订阅的 Topic 变化（正则订阅匹配到新 Topic）。
4. 心跳超时：`session.timeout.ms` 内没心跳，被认为死亡。
5. 轮询超时：`max.poll.interval.ms` 内没调用 poll（消费太久），被踢出组。

**Rebalance 过程（旧版 Eager）**：所有消费者停止消费（STOP THE WORLD）→ 协调者选一个 Leader → Leader 制定分配方案 → 同步给所有人 → 各自开始消费。整个期间组内停摆。

**避免频繁 Rebalance 的手段：**
- `session.timeout.ms` 适当调大（如 30s），避免 GC 长导致误判。
- `max.poll.interval.ms` 调大，或减小 `max.poll.records`，确保长任务能在间隔内完成 poll。
- 用**静态成员**：`group.instance.id` 配置固定 ID，消费者重启后 5 分钟内（`session.timeout.ms` 级别）不触发 Rebalance。
- 使用 **Incremental Cooperative Rebalance**（`partition.assignment.strategy=CooperativeStickyAssignor`），只迁移变动分区，不全局停摆。

**代码示例：**
```properties
# 消费者
group.id=order-group
session.timeout.ms=30000
heartbeat.interval.ms=10000
max.poll.interval.ms=300000
max.poll.records=500
group.instance.id=consumer-01          # 静态成员
partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor
```

**追问：**
- 追问1：Rebalance 期间消息会不会丢？→ 不会丢，但会重复：Rebalance 前已拉取但未提交 offset 的消息，在新分配后会被重新消费。所以消费端必须幂等。
- 追问2：如何监控 Rebalance？→ 开启 DEBUG 日志 `org.apache.kafka.clients.consumer=DEBUG`，或通过 JMX 指标 `consumer-coordinator-rebalance-rate`。生产环境建议接入 Prometheus。
- 追问3：静态成员的局限？→ `session.timeout.ms` 时间内（如 30s）消费者没回来，分区仍会被重新分配；超过该时间再回来会触发一次完整 Rebalance。

**常见误区：** 把 `max.poll.interval.ms` 设得过大。消费逻辑是批量处理，一批 500 条每条 1s，总共 500s，远超默认 5 分钟间隔，消费者被踢出组——这是生产事故常见原因。正确做法：减少 `max.poll.records` 或异步处理 + 手动提交。

**版本说明：** Incremental Cooperative Rebalance 在 Kafka 2.4 引入，3.x 默认仍为 Range；静态成员 2.3 引入。

---

### 8. RocketMQ 架构：NameServer、事务消息、延迟消息

**Q：RocketMQ 的整体架构是什么？它的事务消息和延迟消息是怎么实现的？**

**解答：** RocketMQ 架构组件：
- **NameServer**：轻量级路由注册中心，无状态，各个 NameServer 之间互不通信。Broker 启动时向所有 NameServer 注册，每 30s 心跳；Producer/Consumer 每 30s 从 NameServer 拉取路由信息。某个 NameServer 宕机不影响整体，牺牲强一致性换可用性（AP）。
- **Broker**：实际存储和转发消息，按 Master/Slave 部署。Broker 分多个 Topic，每个 Topic 多个 MessageQueue。
- **Producer**：发送消息，支持同步、异步、单向。
- **Consumer**：推（Push）/拉（Pull）两种模式，支持集群消费（负载均衡）和广播消费。

**事务消息（半消息机制）：**
1. Producer 发送 half 消息到 Broker，Broker 暂时存储在"RMQ_SYS_TRANS_HALF_TOPIC"，对 Consumer 不可见。
2. Broker 回写 Producer ACK，Producer 执行本地事务（如下单写库）。
3. Producer 根据本地事务结果向 Broker 提交 commit/rollback：
   - commit：Broker 把 half 消息移到真实 Topic，Consumer 可见。
   - rollback：丢弃 half 消息。
4. 如果第 3 步 Producer 没回（宕机/网络断），Broker 定期**回查**（check-back）Producer 本地事务状态，Producer 实现 `checkLocalTransaction` 返回状态。

**延迟消息：** RocketMQ 4.x 只支持 18 个固定等级（1s 5s 10s 30s 1m 2m ... 2h）；5.x 支持任意时间。实现：延迟消息写入 `SCHEDULE_TOPIC_XXXX`，每个延迟等级一个队列，后台定时任务扫描到期消息，转发到真实 Topic。

**消息回溯：** Consumer 可以按时间戳重置消费位点（`consumer.seek(timestamp)`），重新消费历史消息，常用于重新对账。

**代码示例（事务消息）：**
```java
TransactionMQProducer producer = new TransactionMQProducer("pg");
producer.setTransactionListener(new TransactionListener() {
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        try {
            orderService.createOrder(msg); // 本地事务
            return LocalTransactionState.COMMIT_MESSAGE;
        } catch (Exception e) {
            return LocalTransactionState.ROLLBACK_MESSAGE;
        }
    }
    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        // 回查：根据 msg 中的 orderId 查 DB，判断订单是否已创建
        return orderService.exists(msg) ? COMMIT_MESSAGE : ROLLBACK_MESSAGE;
    }
});
Message msg = new Message("TopicOrder", "TAG", "buy order".getBytes());
producer.sendMessageInTransaction(msg, null);
```

**追问：**
- 追问1：NameServer 为什么不用 ZooKeeper？→ NameServer 设计目标是极简、无状态、去中心化。ZK 强一致但运维重、故障恢复慢；电商场景允许几秒路由不一致，AP 更合适。
- 追问2：事务消息能解决跨库分布式事务吗？→ 它本质是"本地事务 + 消息最终一致"，适合最终一致场景（如下单后发短信、加积分）。强一致的转账场景仍需 TCC/2PC。
- 追问3：延迟消息精度如何？→ 4.x 固定等级精度差（如指定 7s 实际等到 10s 等级）；5.x 任意时间精度更高，但仍有秒级误差。

**常见误区：** 把事务消息当作"分布式事务银弹"。它只保证"本地事务成功 ⇒ 消息一定投递给下游"，不保证下游消费成功；下游仍需幂等和重试。

**版本说明：** RocketMQ 5.x 引入 POP 消费、无状态 API、任意时间延迟消息；4.x 是当前大量生产环境版本。

---

### 9. 死信队列与重试机制

**Q：消费失败后消息会怎样？什么是死信队列？如何处理死信？**

**解答：** 消息消费失败后，MQ 不会立即丢弃，而是进入重试流程：

**RocketMQ 重试机制：** 集群消费模式下，消费失败返回 `RECONSUME_LATER`，消息被发到 `%RETRY%consumerGroup` 重试队列，重试间隔按 1s 5s 10s 30s 1m 2m 3m ... 2h（共 16 次）。16 次仍失败，进入死信队列 `%DLQ%consumerGroup`。

**Kafka 重试机制：** Kafka 本身没有内置重试队列，需要自己在消费端实现（如失败后发到 retry Topic，带延迟等级）。Spring Kafka 提供 `DefaultErrorHandler`，支持固定退避和指数退避，达到最大次数后可发到 DLT（Dead Letter Topic）。

**RabbitMQ 重试机制：** `basicNack`/`basicReject` 后可 requeue；不 requeue 且配置了死信交换机（DLX），消息会路由到 DLX 绑定的死信队列。

**死信队列的常见用途：**
1. 收集"确实处理不了"的坏消息（脏数据、下游永久故障）。
2. 人工介入排查：死信队列的消息通常意味着代码 BUG 或数据问题，需要开发/运维介入。
3. 修复后重新投递：排查修复后，把死信消息重新发回原队列。

**处理死信的最佳实践：**
- 死信队列单独监控、单独告警，不要静默。
- 死信消费者不要自动重试 N 次——它已经是最后一站，自动重试只会形成新的死信。
- 死信消息落库（MySQL/ES），便于回溯和修复重放。

**代码示例（RabbitMQ 死信交换机声明）：**
```java
// 业务队列绑定 DLX
@Bean
public Queue orderQueue() {
    return QueueBuilder.durable("order.queue")
        .withArgument("x-dead-letter-exchange", "order.dlx")
        .withArgument("x-dead-letter-routing-key", "order.dlq")
        .build();
}
@Bean
public Queue dlq() { return QueueBuilder.durable("order.dlq").build(); }
```

**追问：**
- 追问1：RocketMQ 重试 16 次后消息还能找回吗？→ 能。死信消息保留 3 天（默认），可用 `DefaultMQAdminExt` 查看并重新发送到原 Topic。
- 追问2：消费失败时抛异常 vs 返回 RECONSUME_LATER？→ RocketMQ 中未捕获异常会自动触发重试；显式返回 RECONSUME_LATER 更可控。但要注意：业务可恢复错误（如下游超时）才重试；业务不可恢复错误（参数非法）直接 ack 并进死信，避免无意义重试。
- 追问3：重试会影响消息顺序吗？→ 会。顺序消费模式下，一条消息失败会阻塞整个队列直到重试成功，所以顺序消息对失败处理要求更严格。

**常见误区：** 把所有异常都重试。参数错误、序列化失败、空指针这类编程 BUG，重试 100 次也不会成功，只会刷爆日志和死信队列。应当根据异常类型分类：可恢复异常重试，不可恢复异常直接 ack + 告警。

---

### 10. MQ 推拉模式：Push vs Pull

**Q：MQ 的 Push 模式和 Pull 模式有什么区别？RocketMQ 的"Push"是真的 Push 吗？**

**解答：**

**Pull（拉模式）**：消费者主动向 Broker 请求拉取消息。优点是消费者按自己的处理能力拉，不会被压垮；缺点是如果 Broker 没消息，消费者要轮询，空请求浪费资源，且消息到达后有延迟。

**Push（推模式）**：Broker 有消息就主动推给消费者。优点是实时性高；缺点是 Broker 不了解消费者处理能力，推太快会压垮消费者，推太慢又浪费资源。

**长轮询（Long Polling）**：是 Pull 和 Push 的折中，也是工业界主流。消费者发起 Pull 请求，Broker 如果没有消息，不立即返回空响应，而是挂起请求（hold 住），直到有消息或超时才返回。这样既保证了实时性，又避免了消费者空轮询。

**Kafka 的模型**：纯粹的 Pull。消费者调用 `poll()`，Broker 返回当前可消费的消息（如果没消息则返回空）。消费者自己控制速率和位点。

**RocketMQ 的 Push 实现本质**：表面上叫 PushConsumer，实际上内部是长轮询 Pull。`DefaultMQPushConsumer` 启动一个任务队列，不断调用 `pullKernelImpl()` 拉消息；Broker 端如果没消息，会挂起 5-30s（`suspendTimeMillis`）。对用户屏蔽了拉取细节，看起来像 Push。

**代码示例（Kafka 经典 Pull 循环）：**
```java
while (true) {
    ConsumerRecords<String, String> records =
        consumer.poll(Duration.ofMillis(1000)); // 拉不到就等最多 1s
    for (ConsumerRecord<String, String> r : records) process(r);
    consumer.commitSync();
}
```

**追问：**
- 追问1：长轮询和短轮询区别？→ 短轮询每次立即返回，消费者 sleep 后再问，实时性差；长轮询挂起请求，消息一到立刻返回，实时性接近 Push。
- 追问2：Pull 模式下如何控制消费速率？→ Kafka 通过 `max.poll.records` 和手动提交控制；RocketMQ 通过 `pullThresholdForQueue`（队列缓存消息数上限）和流控阈值控制。
- 追问3：RabbitMQ 是 Push 吗？→ RabbitMQ 是真 Push：消费者注册 `Consumer`，Broker 主动 `basic.deliver` 推过来；配合 QoS（`basicQos`）限制未 ack 消息数，防止压垮消费者。

**常见误区：** 以为 Push 模式 Broker 会无脑推。实际上所有现代 MQ 都是"长轮询 + 流控"，纯 Push 已经被淘汰，因为无法保护消费者。

---

## 八、计算机网络
### 1. TCP 三次握手与四次挥手

**Q：TCP 为什么三次握手而不是两次？TIME_WAIT 为什么是 2MSL？CLOSE_WAIT 过多是什么原因？**

**解答：**

**三次握手**建立连接：
1. 客户端发 SYN（seq=x），进入 SYN_SENT。
2. 服务端回 SYN+ACK（seq=y, ack=x+1），进入 SYN_RCVD。
3. 客户端回 ACK（ack=y+1），双方进入 ESTABLISHED。

**为什么不能两次？** 因为两次握手无法确认客户端的接收能力，且会造成"历史连接"问题。假设客户端发的第一个 SYN 因网络阻塞延迟到，客户端超时重发并建立连接、释放；后来旧 SYN 到达服务端，两次握手下服务端直接建立连接并等待数据——这条永远不会被使用的连接浪费资源。三次握手下，服务端发 SYN+ACK 后，客户端会发 RST 拒绝，服务端释放连接。

**四次挥手**断开连接（TCP 全双工，两个方向都要关）：
1. 主动方发 FIN，进入 FIN_WAIT_1。
2. 被动方回 ACK，进入 CLOSE_WAIT；主动方进入 FIN_WAIT_2。
3. 被动方数据发完，发 FIN，进入 LAST_ACK。
4. 主动方回 ACK，进入 TIME_WAIT；被动方收到 ACK 后 CLOSE。

**TIME_WAIT 为什么是 2MSL？** MSL（Maximum Segment Lifetime）是报文在网络中最长存活时间。2MSL 保证：
- 最后一个 ACK 如果丢失，被动方会重发 FIN，主动方在 2MSL 内还能收到并重发 ACK。
- 让本次连接产生的所有报文在网络中自然消失，防止它们出现在下一个相同四元组的新连接中，被错误接收。

**为什么四次挥手比握手多一次？** 握手时服务端 SYN+ACK 可以合并发；挥手时被动方收到 FIN 只代表"对方不发了"，但自己可能还有数据要发，所以 ACK 和 FIN 不能合并，必须分两步。

**CLOSE_WAIT 过多的原因**：被动方收到 FIN 后进入 CLOSE_WAIT，等待应用调用 close()。如果应用忘记调用 close()（BIO 线程挂死、连接池泄漏、read() 返回 -1 后没关 socket），就会一直停在 CLOSE_WAIT。大量 CLOSE_WAIT 说明应用层有 socket 泄漏，需要查代码。

**代码示例（定位 TIME_WAIT/CLOSE_WAIT）：**
```bash
netstat -an | awk '/tcp/ {print $6}' | sort | uniq -c
# 或 ss -ant state time-wait | wc -l
```

**追问：**
- 追问1：大量 TIME_WAIT 怎么办？→ TIME_WAIT 是主动关闭方的状态，短连接高并发场景会堆积。可优化：服务端开启 `tcp_tw_reuse`（客户端连接重用）、调整 `tcp_max_tw_buckets`；更根本是用长连接/连接池。
- 追问2：SYN_RCVD 过多是什么攻击？→ SYN Flood 攻击：攻击者发大量 SYN 不回 ACK，服务端半连接队列占满。防护：`syncookies`、调大 `backlog`、防火墙限流。
- 追问3：为什么主动方是 TIME_WAIT 而不是被动方？→ 因为最后一个 ACK 由主动方发，它要等这个 ACK 可能的丢失重传。

**常见误区：** 把 TIME_WAIT 当成"故障"。它是正常设计，少量 TIME_WAIT 完全正常；只有堆积到几万/几十万才需要优化。另外，"三次握手为了同步双方序列号"只是原因之一，防历史连接才是关键。

---

### 2. TCP 可靠传输机制

**Q：TCP 如何保证可靠传输？序列号、确认应答、重传、滑动窗口分别起什么作用？**

**解答：** TCP 可靠性是一组机制的组合：

1. **序列号（Sequence Number）**：每个字节都编号。接收方根据 seq 重组数据、去重、按序交付应用层。
2. **确认应答（ACK）**：接收方收到数据后回复 ACK，ack = 期望收到的下一字节 seq。累计确认：ack=n 表示 n 之前所有字节都已收到。
3. **超时重传（RTO）**：发送方发出报文后启动定时器，超时未收到 ACK 就重传。RTO 动态计算，基于 RTT（往返时间）的均值和方差。
4. **快速重传**：不必等 RTO 超时。接收方每收到一个失序报文，就对期望的 seq 重复 ACK；发送方连续收到 3 个重复 ACK，立即重传丢失报文（不用等超时）。
5. **SACK（Selective ACK）**：选择性确认。TCP 选项中告知发送方"我收到了哪些范围"，发送方只重传真正缺失的部分，而不是从缺失点全部重传。
6. **滑动窗口（流量控制）**：接收方在 ACK 中通告 rwnd（receive window），告诉发送方"我还能收多少"。发送方发送量不超过 rwnd，防止接收方缓冲区被打满。窗口大小随 ACK 动态滑动。

**追问：**
- 追问1：滑动窗口和拥塞窗口区别？→ rwnd（接收窗口）由接收方控制，做流量控制；cwnd（拥塞窗口）由发送方根据网络状况估计，做拥塞控制。实际发送窗口 = min(rwnd, cwnd)。
- 追问2：Nagle 算法是什么？→ TCP 默认开启 Nagle，小数据包攒到一个窗口或 MSS 再发，减少网络小包数。交互场景（如 SSH、RPC）可 `TCP_NODELAY` 关闭。
- 追问3：粘包拆包怎么解决？→ TCP 是字节流，没有消息边界。应用层必须自己处理：固定长度、特殊分隔符、或报文头 + 长度字段（HTTP Content-Length、gRPC 帧）。

**代码示例（TCP_NODELAY）：**
```java
Socket socket = new Socket(host, port);
socket.setTcpNoDelay(true); // 关闭 Nagle，低延迟 RPC 常用
```

**常见误区：** 认为"TCP 可靠 = 一定不丢"。TCP 保证的是"尽最大努力交付 + 端到端错误恢复"，在磁盘满、主机崩溃、网络长时间中断时仍会丢。应用层需要超时重试和幂等。

---

### 3. TCP 拥塞控制

**Q：慢开始、拥塞避免、快重传、快恢复的过程？BBR 和传统基于丢包的拥塞控制有什么区别？**

**解答：** 拥塞控制是发送方根据网络状况调整发送速率，防止把网络打垮。经典算法（Reno）四个阶段：

1. **慢开始（Slow Start）**：连接初期 cwnd = 1，每收到一个 ACK，cwnd 加 1。RTT 后 cwnd 翻倍（指数增长），直到到达慢开始门限 ssthresh。
2. **拥塞避免（Congestion Avoidance）**：cwnd >= ssthresh 后，每个 RTT cwnd 只加 1（线性增长），缓慢探测网络容量。
3. **快重传**：收到 3 个重复 ACK，不等超时立即重传丢失报文。
4. **快恢复**：快重传后，不把 cwnd 降回 1（那是超时才做的），而是 `ssthresh = cwnd/2; cwnd = ssthresh`，进入拥塞避免。说明网络只是偶发丢包，不是真的拥塞。

超时重传时（真的发生严重拥塞）：`ssthresh = cwnd/2; cwnd = 1`，重新慢开始。

**BBR 算法（Google 2016 提出）**：传统算法把"丢包"当作拥塞信号，但在随机误码、缓存膨胀的链路上丢包不代表拥塞。BBR 转而测量两个关键值：
- **带宽瓶颈（BtlBw）**：链路最大能跑多快。
- **最小 RTT（RTprop）**：传播时延下界。

BBR 让发送速率保持在 BtlBw 附近、 inflight 保持在 BtlBw × RTprop（BDP），不盲目追高队列、也不因为随机丢包就降速。在长肥管道、跨地域、卫星链路下吞吐显著优于 Reno/CUBIC。

**追问：**
- 追问1：cwnd 和 rwnd 区别？→ cwnd 是发送方根据网络拥塞估计；rwnd 是接收方通告的接收缓冲区大小。发送上限 = min(cwnd, rwnd)。
- 追问2：为什么慢开始叫"慢"？→ 名义上指数增长，但初始 cwnd=1，起步阶段其实很慢；名字是相对于"直接把窗口开到最大"而言。
- 追问3：BBR 的缺点？→ BBR 在共享瓶颈链路时对 Reno/CUBIC 流不友好，可能抢占更多带宽；早期版本 BBRv1 有排队膨胀问题，BBRv2/v3 改进了公平性。

**常见误区：** 认为"网络卡就调大 socket buffer"。如果瓶颈在网络带宽，调大 buffer 只会让数据在路由队列里排队，RTT 更高，不解决问题。拥塞窗口是动态的，受算法控制。

---

### 4. HTTP/1.1 vs HTTP/2 vs HTTP/3

**Q：HTTP 三个版本的核心区别？什么是队头阻塞？HTTP/3 为什么用 UDP？**

**解答：**

**HTTP/1.1**：
- 长连接（Keep-Alive）默认开启，但同一连接上请求串行处理——**HTTP 层队头阻塞**：一个慢请求会阻塞后面所有请求。
- 解决办法是浏览器开 6 个 TCP 并发连接，但连接数受限、开销大。
- 文本协议，头部冗余。

**HTTP/2**（2015）：
- **二进制分帧**：把报文拆成带 stream ID 的帧，在一条 TCP 连接上并行传输多个请求——解决了 HTTP 层队头阻塞。
- **多路复用**：多个 stream 共享一条 TCP，互不阻塞。
- **头部压缩 HPACK**：静态表 + 动态表 + Huffman 编码，相同头部只传增量，省流量。
- **服务器推送**：服务端主动推资源（实际用得少）。
- **但仍有 TCP 层队头阻塞**：一个 TCP 包丢失，后面所有 stream 的帧都要等重传，应用层看到的就是"所有请求卡住"。

**HTTP/3（2022 RFC 9114）**：
- 基于 **QUIC**，跑在 UDP 上。
- QUIC 在应用层实现可靠传输和流控，**每个 stream 独立可靠**：一个 stream 丢包不影响其他 stream，彻底解决 TCP 层队头阻塞。
- **0-RTT**：TLS 握手和连接建立合并，复用连接时 0-RTT 恢复，比 TLS 1.3 的 1-RTT 更快。
- **连接迁移**：用 Connection ID 标识连接，手机切 Wi-Fi/4G 时不用重新握手。
- 内置 TLS 1.3。

**追问：**
- 追问1：HPACK 和 HTTP/1.1 的 gzip 压缩有什么不同？→ gzip 压缩整体文本，无法处理"头部字段变化但字典不同步"；HPACK 用静态表（常见头部预定义）+ 动态表（连接内通信双方同步），相同字段索引化，只传索引，效率高。
- 追问2：HTTP/2 多路复用下为什么还会队头阻塞？→ TCP 是字节流，任何字节丢失，接收方必须等重传才能交给上层；不管上层 stream ID 是什么，都被卡在 TCP 层。
- 追问3：HTTP/3 用 UDP 不就不可靠了吗？→ QUIC 在 UDP 之上自己实现了可靠、流控、拥塞控制，比 TCP 更灵活。

**常见误区：** 以为 HTTP/2 解决了所有队头阻塞。它只解决了 HTTP 层，TCP 层仍然存在；HTTP/3 才彻底解决。另外 HTTP/2 必须跑在 HTTPS 上（主流浏览器实现要求）。

---

### 5. HTTPS 与 TLS

**Q：HTTPS 的握手过程？TLS 1.2 和 1.3 有什么区别？证书链怎么验证？**

**解答：** HTTPS = HTTP + TLS。设计目标：机密性（对称加密）、身份认证（证书）、完整性（MAC）。

**混合加密**：非对称加密交换会话密钥（安全但慢），对称加密传输数据（快但密钥要保密）。两者结合。

**TLS 1.2 握手（简化）**：
1. Client Hello：客户端发支持的 TLS 版本、加密套件列表、随机数 Client Random。
2. Server Hello：选定加密套件、随机数 Server Random、服务器证书（公钥）。
3. 客户端验证证书后，生成 Pre-Master-Secret，用服务器公钥加密发过去。
4. 双方用 Client Random + Server Random + Pre-Master-Secret 计算出会话密钥。
5. 通信用对称加密 + MAC。

整个过程 **2-RTT**。

**TLS 1.3 改进（2018）**：
- 握手 **1-RTT**（复用会话 0-RTT）。
- 删除不安全加密套件（RC4、SHA1、CBC 等）。
- 服务器证书加密传输（1.2 中证书明文）。
- 客户端也必须发证书时可以 0-RTT 完成。

**证书链验证**：
1. 浏览器拿到服务器证书（由中间 CA 签发）。
2. 验证证书链：服务器证书 ← 中间 CA 证书 ← 根 CA 证书（根 CA 预置在操作系统/浏览器）。
3. 校验：域名匹配、有效期、签名未被篡改、是否在吊销列表（CRL/OCSP）。
4. 任意一环失败，浏览器报 NET::ERR_CERT_AUTHORITY_INVALID 等。

**追问：**
- 追问1：为什么不全程用非对称加密？→ 非对称加密比对称慢 100-1000 倍，大文件传输不可接受。所以只用它交换密钥。
- 追问2：RSA 密钥交换和 ECDHE 区别？→ RSA 密钥交换不支持前向保密（服务器私钥泄漏，历史流量全可解密）；ECDHE（临时密钥）每次握手生成临时密钥，私钥泄漏也解不开历史流量。TLS 1.3 只支持 ECDHE。
- 追问3：证书吊销为什么有 CRL 和 OCSP 两套？→ CRL 是全量吊销列表，大且更新慢；OCSP 实时查询，但有隐私问题（CA 知道你访问哪些站）和性能问题。OCSP Stapling 让服务器 stapling 自己的 OCSP 响应给客户端，兼顾实时和隐私。

**代码示例（OpenSSL 验证证书链）：**
```bash
openssl s_client -connect example.com:443 -servername example.com
# 查看 Certificate chain、Verify return code
```

**常见误区：** 以为 HTTPS 只是"加密 HTTP"。它还包含身份认证（防止中间人钓鱼）和完整性（防篡改）。另外，TLS 1.3 大幅简化了握手，不要再用 TLS 1.2 的过程去答 1.3 的问题。

---

### 6. DNS 解析过程

**Q：浏览器输入域名后，DNS 怎么查到 IP？递归查询和迭代查询区别？**

**解答：** 浏览器查 DNS 的顺序：
1. **浏览器缓存**：Chrome 内置 DNS 缓存（1min）。
2. **操作系统缓存**：hosts 文件 + OS resolver 缓存。
3. **本地 DNS 服务器（LDNS）**：通常是运营商或公司 DNS（如 114.114.114.114、8.8.8.8）。LDNS 没命中就开始**递归查询**。
4. **根 DNS 服务器**：LDNS 问根，根说"com 顶级域去找它"。
5. **顶级域（TLD）服务器**：.com 服务器告诉 LDNS "example.com 权威 DNS 在这"。
6. **权威 DNS 服务器**：返回 example.com 的真实 IP。
7. LDNS 缓存结果，返回给浏览器。

**递归 vs 迭代**：
- **递归查询**（客户端 → LDNS）：客户端只问一次，LDNS 负责把最终答案拿回来，"你帮我查到底"。
- **迭代查询**（LDNS → 根 → TLD → 权威）：每个服务器告诉 LDNS"下一步找谁"，LDNS 自己一步步问。

**DNS 污染（DNS Poisoning）**：攻击者抢在权威 DNS 之前返回伪造结果（如把 google.com 解析到错误 IP），常见于网络审查场景。
**DNS over HTTPS（DoH）/ DNS over TLS（DoT）**：把 DNS 查询加密在 HTTPS/TLS 里，防止中间人窃听和篡改。

**追问：**
- 追问1：CDN 是怎么工作的？→ 权威 DNS 根据 LDNS 的出口 IP（Local DNS 所在位置）返回最近的 CDN 节点 IP，实现就近接入。
- 追问2：DNS 负载均衡怎么做？→ 一个域名配多条 A 记录，DNS 轮询返回不同 IP，简单粗暴但不健康检查。
- 追问3：TTL 是什么？→ DNS 记录缓存时间。改 IP 后要等 TTL 过期才生效，所以变更前应提前把 TTL 调小（如 60s）。

**常见误区：** 以为浏览器直接问根服务器。实际浏览器只和 LDNS 打交道，根/TLD/权威的迭代过程发生在 LDNS 内部。

---

### 7. Cookie / Session / Token / JWT

**Q：HTTP 是无状态的，怎么维持登录状态？Cookie、Session、Token、JWT 各有什么区别？**

**解答：**

**Cookie**：服务器通过 `Set-Cookie` 响应头让浏览器存一小段数据，之后浏览器每次自动带上。缺点：大小限制 4KB、数量受限、跨域不带、CSRF 风险。

**Session**：服务器端存储用户状态。浏览器登录后拿到 `JSESSIONID` Cookie，后续请求带它，服务器根据 ID 查 Session。缺点：多实例下 Session 共享难（需要 Redis 集中存储），服务器有状态。

**Token（Bearer Token）**：登录后服务器发一个不透明字符串，后续请求放 `Authorization: Bearer xxx`。服务器可以用 Redis 校验，无状态、跨域友好。缺点：服务器仍要存储或校验。

**JWT（JSON Web Token）**：自包含 Token，结构三段用 `.` 连接：
- **Header**：算法类型（alg=HS256）。
- **Payload**：claims（用户 ID、过期时间、角色），**只是 Base64 编码，不是加密**。
- **Signature**：用服务器私钥对 Header+Payload 签名，防篡改。

优点：无状态，服务器不用存，适合分布式/微服务。
缺点：签发后不能主动失效（除非加黑名单）；Payload 不能放敏感信息；体积比 Session ID 大。

**刷新令牌（Refresh Token）**：Access Token 短期（15min），Refresh Token 长期（7d）。Access 过期后用 Refresh 换新的，避免用户频繁登录，同时缩小 Access 泄漏窗口。

**代码示例（JWT 结构）：**
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEyMywiZXhwIjoxNzAwMDAwMDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**追问：**
- 追问1：JWT 为什么不能放敏感信息？→ Payload 只是 Base64 编码，任何人解码可读。不要放手机号、密码、身份证号。
- 追问2：JWT 怎么登出？→ 标准 JWT 无法主动失效。做法：Redis 黑名单（登出时把 jti 加入过期集合）；或缩短 Access Token 有效期，配合 Refresh Token。
- 追问3：Cookie 为什么防 CSRF？→ Cookie 自动带，攻击者网站可以诱使用户浏览器发请求带上 Cookie。防护：CSRF Token、SameSite Cookie、校验 Referer/Origin。

**常见误区：** 以为 JWT 是加密的。它是签名的——防篡改但不保密。另外，"JWT 无状态所以一定高性能"是误解：每次请求都要验签（非对称算法尤其贵），且无法主动失效在登出场景是硬伤。

---

### 8. 输入 URL 到页面显示全过程

**Q：在浏览器输入 https://www.example.com 回车，到页面完整显示，中间发生了什么？**

**解答：** 完整流程：

1. **URL 解析**：浏览器判断是搜索还是 URL，补全协议/域名。
2. **DNS 解析**：域名 → IP（见第 16 点）。
3. **TCP 连接**：三次握手建立到 IP:443 的连接。
4. **TLS 握手**：交换密钥、验证证书、建立加密通道（见第 15 点）。
5. **发 HTTP 请求**：构造请求行、Header、Body；Cookie 自动带上。
6. **服务器处理**：负载均衡 → 网关 → 业务服务 → 数据库 → 返回响应。
7. **浏览器解析**：
   - 解析 HTML 构建 DOM 树。
   - 解析 CSS 构建 CSSOM 树。
   - DOM + CSSOM → 渲染树（Render Tree）。
   - 布局（Layout/Reflow）：计算元素位置大小。
   - 绘制（Paint）：像素级绘制。
   - 合成（Composite）：图层合并上屏。
8. **加载子资源**：CSS/JS/图片并行加载，JS 执行会阻塞 DOM 解析（除非 async/defer）。
9. **重排重绘**：JS 修改 DOM/CSS 触发 Layout → Paint → Composite。

**追问：**
- 追问1：重排（Reflow）和重绘（Repaint）区别？→ 改几何属性（宽高位置）触发重排，重排后必然重绘；只改颜色/背景触发重绘，不重排。重排成本远高于重绘。
- 追问2：怎么优化首屏？→ CDN、HTTP/2、关键 CSS 内联、JS 加 defer、图片懒加载、SSR。
- 追问3：浏览器缓存？→ 强缓存（Cache-Control/Expires，不发请求）+ 协商缓存（ETag/If-None-Match，304）。

**常见误区：** 把"白屏时间"等同于"TCP+TLS 时间"。白屏还包含 HTML 下载、CSS 解析、首屏渲染，后端响应快不代表白屏快。

---

### 9. WebSocket 与 SSE

**Q：WebSocket 和 SSE 都能做服务端推送，有什么区别？各自适用场景？**

**解答：**

**WebSocket**：
- 建立在 TCP 上，通过 HTTP  Upgrade 握手（`Connection: Upgrade, Upgrade: websocket`），握手后变成**全双工**通道，客户端和服务端可以随时互发消息。
- 协议 `ws://` / `wss://`。
- 适合：聊天室、协同编辑、游戏、实时行情双向交互。
- 自带心跳机制（ping/pong 帧）保活。

**SSE（Server-Sent Events）**：
- 基于普通 HTTP，服务端返回 `Content-Type: text/event-stream`，保持连接不断开，持续推送 `data: ...\n\n`。
- **单向**：只能服务端 → 客户端，客户端要发消息仍需另开 HTTP 请求。
- 协议 `http://`，天然支持自动重连、事件 ID。
- 适合：股票推送、新闻 feed、监控告警等"服务端单向推送"场景。

**对比：**
| 维度 | WebSocket | SSE |
|---|---|---|
| 方向 | 全双工 | 服务端单向 |
| 协议 | ws/wss | http/https |
| 兼容性 | IE10+，现代浏览器 | IE 不支持，Edge 79+ |
| 代理/防火墙 | 可能被中间件拦 | 普通 HTTP，友好 |
| 自动重连 | 需自己实现 | 内置 |
| 二进制支持 | 原生 | 文本为主 |

**代码示例（SSE）：**
```java
// Spring Boot
@GetMapping(value = "/sse", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter stream() {
    SseEmitter emitter = new SseEmitter(0L);
    scheduledExecutor.scheduleAtFixedRate(() -> {
        try { emitter.send(SseEmitter.event().data("hello " + System.currentTimeMillis())); }
        catch (Exception e) { emitter.completeWithError(e); }
    }, 0, 1, TimeUnit.SECONDS);
    return emitter;
}
```

**追问：**
- 追问1：HTTP/2 还需要 WebSocket 吗？→ HTTP/2 有服务器推送（Push），但浏览器实现基本废弃了；双向高频通信仍用 WebSocket 或 WebTransport（HTTP/3）。
- 追问2：WebSocket 连接保活怎么做？→ 客户端定时发 ping，服务端回 pong；Nginx 默认 60s 无活动断开，需调 `proxy_read_timeout`。
- 追问3：WebSocket 多实例怎么广播？→ 单个 WebSocket 连接绑在某一台机器上，跨实例广播需要借助 MQ（Redis Pub/Sub、Kafka）扇出到所有节点。

**常见误区：** 用 WebSocket 做"只推送一两次就完"的场景（如邮件通知），杀鸡用牛刀；SSE 或轮询更简单。反过来，聊天、协同这种双向高频场景用 SSE 就要自己再发 HTTP，很别扭。

---

### 10. 跨域与 CORS

**Q：浏览器同源策略是什么？什么是简单请求和预检请求？如何携带 Cookie？**

**解答：** **同源策略**：协议、域名、端口三者完全一致才算同源。不同源的 JS 不能读写对方 DOM、不能发带凭证的 AJAX。这是浏览器安全基石，防止恶意网站读你的银行页面。

**CORS（跨域资源共享）**是服务器授权跨域的标准机制：

**简单请求**同时满足：
- 方法是 GET/HEAD/POST。
- Header 仅 Accept、Accept-Language、Content-Language、Content-Type（限 text/plain、multipart/form-data、application/x-www-form-urlencoded）。
- 不触发自定义 Header。

简单请求直接发，响应里带 `Access-Control-Allow-Origin: *` 或指定源。

**预检请求（Preflight）**：不满足简单请求条件时（如 PUT、自定义 Header、application/json），浏览器先发一个 OPTIONS 请求问服务器"我能不能这么发"：
```
OPTIONS /api HTTP/1.1
Origin: https://a.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: X-Token
```
服务器响应：
```
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Methods: GET,POST,PUT
Access-Control-Allow-Headers: X-Token
Access-Control-Max-Age: 86400   # 预检结果缓存 1 天
```
通过后才发真正的请求。

**携带 Cookie**：默认跨域 AJAX 不带 Cookie。需要：
- 前端：`xhr.withCredentials = true` 或 `fetch(..., { credentials: 'include' })`。
- 后端：`Access-Control-Allow-Origin: https://a.com`（不能是 `*`）+ `Access-Control-Allow-Credentials: true`。

**追问：**
- 追问1：CORS 是防火墙吗？→ 不是。它是浏览器端的限制，服务端之间用 curl/Postman 调用不受 CORS 约束。安全上不要依赖 CORS 防爬虫，要鉴权。
- 追问2：JSONP 是什么？→ 老办法跨域：`<script src="?callback=fn">`，利用 script 标签不受同源限制。只支持 GET，已被 CORS 取代。
- 追问3：预检请求太多怎么办？→ 设 `Access-Control-Max-Age` 缓存预检结果；避免无谓的自定义 Header 和非简单 Content-Type。

**常见误区：** 以为"后端返回 `Access-Control-Allow-Origin: *` 就解决了"。带 Cookie 时 `*` 不被接受，必须指定具体源。另外，CORS 报错时问题在响应头，不是请求本身——F12 Network 看响应头最直接。

---

## 九、分布式系统
### 1. CAP 定理与 BASE 理论

**Q：CAP 定理是什么？为什么只能三选二？BASE 和 ACID 怎么对应？**

**解答：** **CAP** 是分布式系统三个属性：
- **C（Consistency）**：一致性，所有节点同一时刻看到相同数据（线性一致性）。
- **A（Availability）**：可用性，每个请求都能收到非错误响应（不保证是最新数据）。
- **P（Partition Tolerance）**：分区容忍性，网络分区（节点间通信中断）时系统仍能运作。

**为什么只能三选二？** 分布式系统节点之间靠网络通信，网络一定会断（光纤被挖、交换机挂），**P 是必选项**。所以实际是在 CP 和 AP 之间权衡：
- **CP**：发生网络分区时，拒绝部分请求保一致。代表：ZooKeeper、etcd、HBase。
- **AP**：发生分区时，各节点继续服务，分区期间数据可能不一致，恢复后异步同步。代表：Eureka、Cassandra、DynamoDB。

注意：**CAP 不是"三选二"的教条**——网络分区不发生时 CA 可以兼得；P 只在分区发生时才被迫取舍。Eric Brewer 本人后来也强调，CAP 被过度简化了。

**BASE 理论**是对 CAP 中 AP 的延伸：
- **BA（Basically Available）**：基本可用，允许响应时间增加或功能降级（如搜索结果延迟、推荐关闭）。
- **S（Soft State）**：软状态，允许系统存在中间状态（数据不同步）。
- **E（Eventually Consistent）**：最终一致，经过一段时间后所有副本最终一致，不保证实时强一致。

**追问：**
- 追问1：ZooKeeper 是 CP 还是 AP？→ 经典说法是 CP。Leader 选举期间不可用（半数以上节点才选得出 Leader），牺牲可用性换一致。Eureka 是 AP，节点宕机不影响其他人注册。
- 追问2：Redis 是 CP 还是 AP？→ Redis Cluster 主从异步复制，主节点写成功就返回，从节点可能没同步——偏 AP；如果要求强一致需要 WAIT 命令等待副本，但那会显著降可用性。
- 追问3：什么时候选 CP？→ 配置中心、分布式锁、元数据管理（钱、库存、权限）这类"错了比不可用更严重"的场景。什么时候选 AP？→ 社交动态、商品详情、推荐这种"短暂不一致可接受"的场景。

**常见误区：** 把 CP/AP 当成产品的固有属性。同一产品不同模块可以不同选择；且 CAP 描述的是"分区发生时"的行为，不是日常运行状态。

---

### 2. 分布式事务

**Q：跨服务/跨库怎么保证数据一致？2PC、3PC、TCC、Saga、本地消息表各有什么区别？**

**解答：** 分布式事务解决"多个参与者要么全成功要么全失败"的问题。

**2PC（两阶段提交）**：
- **Prepare**：协调者问所有参与者"能提交吗"，参与者执行事务但不提交，锁定资源。
- **Commit/Rollback**：全部 Yes 才 Commit；任一 No 就 Rollback。
- 缺点：同步阻塞（参与者一直锁资源）、协调者单点、Prepare 后协调者宕机参与者阻塞。

**3PC**：把 Prepare 拆成 CanCommit + PreCommit，引入超时机制减少阻塞，但仍有网络分区下不一致风险，工程上很少用。

**TCC（Try-Confirm-Cancel）**：业务层面两阶段：
- **Try**：预留资源（冻结金额、冻结库存）。
- **Confirm**：确认执行（扣减冻结）。
- **Cancel**：取消执行（释放冻结）。
- 优点：不锁资源、性能好；缺点：业务侵入大，每个操作要写三个接口，要处理空回滚、幂等、悬挂。

**Saga**：长事务拆成多个本地事务，每个本地事务配一个补偿动作。正向执行 T1→T2→T3，失败则反向 C3→C2→C1。适合长流程（下单 → 扣库存 → 扣款 → 发物流），无隔离性（中间状态可见）。

**本地消息表（最终一致）**：把消息存在本地业务库的一张表里，和业务操作在同一本地事务；后台任务扫描消息表发到 MQ，消费者幂等消费。无分布式事务协调器，简单可靠，是互联网常用方案。

**最大努力通知**：支付成功后支付宝反复通知商户，商户必须幂等，直到成功或超过次数。

**Seata**：阿里开源框架，四种模式：AT（自动补偿，基于 SQL 反向生成）、TCC、Saga、XA。AT 模式最常用：一阶段把业务数据更新和 undo log 一起提交，二阶段根据全局事务状态决定删 undo log 还是反向补偿。

**追问：**
- 追问1：TCC 的空回滚和悬挂是什么？→ 空回滚：Try 还没到（超时），Cancel 先到，要识别并返回成功不做事；悬挂：Cancel 先到后 Try 才到，Try 必须拒绝（因为已经取消了）。
- 追问2：AT 模式怎么保证隔离性？→ 默认是"读未提交"（写隔离通过全局锁，读隔离靠 SELECT FOR UPDATE 加全局读锁）。
- 追问3：为什么互联网多用最终一致而不是强一致？→ 强一致（2PC/XA）性能差、可用性低；业务上（下单送积分）允许短暂不一致，用本地消息表 + 重试 + 对账足够。

**代码示例（本地消息表伪代码）：**
```sql
-- 业务表和消息表在同一个数据库/本地事务中
BEGIN;
  INSERT INTO orders (...) VALUES (...);
  INSERT INTO mq_msg (msg_id, topic, payload, status) VALUES (?, 'order-created', ?, 'NEW');
COMMIT;
-- 后台定时任务：扫描 status=NEW，发 MQ，成功后 UPDATE status=SENT
```

**常见误区：** 把分布式事务当"银弹"。绝大多数业务场景最终一致就够了，引入 TCC/Seata 会增加大量复杂度和运维成本，要权衡。

---

### 3. Raft 一致性算法

**Q：Raft 怎么选主？日志怎么复制？为什么能保证安全性？**

**解答：** Raft 是 etcd/Consul/KV 系统用的共识算法，把问题拆成三个子问题：Leader 选举、日志复制、安全性。

**基本角色**：Leader（处理所有写）、Follower（被动复制）、Candidate（选举中间态）。Term（任期）是单调递增的逻辑时钟，每个 Term 最多一个 Leader。

**Leader 选举**：
1. Follower 超时没收到 Leader 心跳，转 Candidate，Term+1，投自己。
2. 向其他节点发 RequestVote。
3. 收到多数票就成为 Leader，发心跳确立权威。
4. 若选举超时（多个候选者瓜分选票），随机退避后重新选举。随机化避免活锁。

**日志复制**：
1. 客户端写请求到 Leader。
2. Leader 把命令追加到本地日志，并行发 AppendEntries 给 Follower。
3. 多数 Follower 持久化后，Leader commit，回复客户端。
4. Leader 异步通知 Follower 提交。

**安全性（关键）**：
- 选举限制：Candidate 必须包含所有已 committed 日志才能当选（RequestVote 比较日志新旧），防止旧 Leader 被重新选出丢数据。
- 提交限制：Leader 只能提交当前 Term 的日志，通过"提交一条当前 Term 日志间接包含之前所有 Term 已复制到多数"来确认 committed。
- **多数派（Quorum）**：N 个节点，写需要 `N/2+1` 个确认，读/选主也需要多数派。脑裂时（网络分区）少数派分区无法凑够多数，不能选 Leader/提交，保证不会出现两个 Leader。

**追问：**
- 追问1：Raft 和 Paxos 区别？→ Raft 设计目标是"可理解性"，把选主、日志复制、安全性拆分得清楚；Paxos 更通用但难学难懂。工程实现几乎都选 Raft。
- 追问2：为什么用多数派而不是全部？→ 全部确认（同步复制）可用性差，一个节点慢拖死全局；多数派保证任意两个多数派集合必有交集，避免脑裂双写。
- 追问3：Raft 集群多大合适？→ 3、5、7 节点。3 容忍 1 台故障，5 容忍 2 台。节点越多写延迟越高（要等更多副本）。

**常见误区：** 以为 Raft 是"CP 协议"就零代价。Raft 写延迟 = 多数派中最慢节点的延迟，跨机房部署时要评估。另外，Raft 保证的是已提交日志不丢，未提交的仍可能丢。

---

### 4. 分布式 ID 方案

**Q：分布式系统怎么生成全局唯一 ID？雪花算法时钟回拨怎么办？**

**解答：** 常见方案：

1. **UUID**：`uuidgen` 生成 128 位随机 ID。优点：本地生成无依赖。缺点：太长（36 字符）、无序（作 MySQL 主键导致页分裂、索引性能差）、无业务含义。
2. **数据库自增 ID**：简单，但单点瓶颈；可用多实例步长（实例 A 用 1,3,5...，实例 B 用 2,4,6...）解决，但扩容麻烦。
3. **号段模式（Leaf-Segment）**：DB 存当前最大 ID，应用一次取一段（如 1000 个）放内存用，用完再取。DB 压力小，ID 连续。美团 Leaf、百度 UidGenerator 都是这个思路。
4. **雪花算法 Snowflake**：64 位 long = 1 符号位 + 41 时间戳（ms，约 69 年）+ 10 机器 ID（1024 台）+ 12 序列号（每毫秒 4096 个）。趋势递增、本地生成、高性能。

**雪花算法时钟回拨问题**：机器 NTP 校时把时钟往回拨，可能生成重复 ID。应对：
- 回拨很小（如 < 5ms）：等待时钟追上再生成。
- 回拨较大：报错或切备用机器号。
- 用扩展方案：百度 UidGenerator 用 RingBuffer 预分配，容忍回拨；美团 Leaf-Snowflake 把机器号和时间戳放在 DB 中持久化，启动时检测回拨。

**代码示例（Snowflake 结构）：**
```
0 | 41 bit 时间戳（毫秒） | 10 bit workerId | 12 bit 序列号
```

**追问：**
- 追问1：号段模式双 buffer 优化？→ 取一个号段时异步准备下一个，当前用完立即切换下一个，避免 DB 访问阻塞业务。
- 追问2：为什么 UUID 不适合 MySQL 主键？→ InnoDB 聚簇索引按主键排序插入，UUID 随机导致页分裂、磁盘随机 IO、索引膨胀。
- 追问3：Redis 分布式 ID？→ `INCR` 是原子的，但要持久化和集群一致性，且性能不如本地算法。适合 ID 量不大的场景。

**常见误区：** 直接用 UUID 当分布式主键。一定要用趋势递增方案（雪花/号段），尤其做主键时。

---

### 5. 分布式锁

**Q：Redis、ZooKeeper、etcd 怎么实现分布式锁？各自优缺点？怎么保证锁的正确性？**

**解答：** 分布式锁必须满足：互斥、防死锁（持锁者宕机自动释放）、可重入、高可用、性能。

**Redis 实现（SET NX EX）**：
```
SET lock:order:123 <uuid> NX EX 30
```
- `NX`：key 不存在才设置。
- `EX 30`：30s 自动过期，防死锁。
- value 存唯一 token，释放时用 Lua 脚本原子比较再删，防止误删别人的锁。

**Redisson（生产推荐）**：内置看门狗（watchdog）自动续期，锁业务没执行完不会过期；可重入；支持 RedLock（多 Redis 节点多数派）。

**ZooKeeper 实现**：创建**临时有序节点** `/lock/node_0000001`，判断自己是不是序号最小的；不是则监听前一个节点。前一个节点删除（释放锁或宕机会话结束），自己收到通知成为最小节点，获得锁。临时节点 + 会话机制天然防死锁。

**etcd 实现**：基于 Raft 的分布式 KV，用 Lease + Transaction（Compare-and-Delete）。`Put key value --lease=xxx` 加锁，Lease 到期自动释放。

**对比：**
| 维度 | Redis | ZooKeeper | etcd |
|---|---|---|---|
| 一致性 | AP（主从异步复制，可能丢锁） | CP（ZAB） | CP（Raft） |
| 性能 | 极高 | 中 | 中 |
| 死锁恢复 | 靠 TTL | 会话断开自动删 | Lease 过期 |
| 适用 | 高并发、锁偶失效可接受 | 强一致、但 ZooKeeper 重 | 云原生、K8s 生态 |

**锁的正确性条件：**
1. **互斥**：同一时刻只有一个持有者。
2. **防死锁**：持锁者崩溃也能释放。
3. **释放者必须是持有者**：用唯一 token + Lua 原子删。
4. **可重入**：同一线程可重入。

**代码示例（Redisson）：**
```java
RLock lock = redissonClient.getLock("order:123");
try {
    if (lock.tryLock(30, 300, TimeUnit.SECONDS)) {
        doBusiness();
    }
} finally {
    if (lock.isHeldByCurrentThread()) lock.unlock();
}
```

**追问：**
- 追问1：RedLock 是什么？→ 向 N（通常 5）个独立 Redis 节点加锁，多数成功才算成功，防止单点 Redis 主从切换丢锁。Martin Kleppmann 和 Antirez 有著名争论：RedLock 在 GC 停顿、时钟漂移下仍可能不安全。
- 追问2：Redis 锁超时了业务还没跑完怎么办？→ 看门狗自动续期（Redisson 默认每 10s 续到 30s）。或者把锁粒度调小、业务做幂等，不依赖长锁。
- 追问3：ZooKeeper 羊群效应？→ 所有等待者都监听同一个锁节点，释放时全部被唤醒争抢（羊群）。有序节点 + 只监听前一个节点避免这个问题。

**常见误区：** 用 `SETNX` + 过期时间就以为安全。两个致命错误：① 不设过期，持锁者宕机永远死锁；② 释放锁直接 `DEL`，可能删掉别人已经续期/重新获取的锁。必须用 token + Lua 原子释放。

---

### 6. 服务注册与发现

**Q：Eureka、Nacos、Consul、ZooKeeper 各自怎么实现服务注册发现？AP vs CP 怎么选？**

**解答：** 服务注册发现解决"服务消费者怎么找到服务提供者"的问题：提供者启动时注册自己的 IP:Port，消费者从注册中心拉取列表并本地缓存。

**核心组件：**
- **注册中心**：存储服务实例列表、元数据、健康状态。
- **心跳**：提供者定时（如 5s）发心跳注册中心，证明自己活着；超时（如 15s）剔除。
- **健康检查**：主动探活（HTTP/TCP）或被动心跳。
- **推送/拉取**：实例变更时注册中心推送，或消费者定时拉。

**对比：**
| 维度 | Eureka | Nacos | Consul | ZooKeeper |
|---|---|---|---|---|
| CAP | AP | AP/CP 可切 | CP | CP |
| 健康检查 | 客户端心跳 | 心跳 + TCP/HTTP | Agent 主动探活 | 会话/临时节点 |
| 多数据中心 | 不支持 | 支持 | 支持 | 不支持 |
| 配置中心 | 无 | 内置 | KV 内置 | KV |
| 生态 | Spring Cloud 原生 | Spring Cloud Alibaba | HashiCorp | Hadoop/Kafka 老系 |

**Eureka 为什么 AP？** 注册中心节点之间 P2P 复制，网络分区时各节点仍可读写，允许短暂不一致；客户端本地缓存注册表，注册中心全挂也能继续调用。适合"服务调用不能因为注册中心挂掉就不可用"的场景。

**ZooKeeper 为什么 CP？** 用 ZAB 协议，半数以上节点存活才可用。Leader 选举期间不可用；客户端拿到的是强一致数据。适合"配置、分布式锁"这类不能容忍错数据的场景。

**Nacos** 可通过 `ephemeral=true/false` 切换：临时实例（AP，心跳）/ 持久实例（CP，Raft）。

**追问：**
- 追问1：为什么不把所有依赖都注册？→ 数据库、Redis 这种固定地址的不用注册；只有动态扩缩容的无状态服务才用。
- 追问2：注册中心挂了怎么办？→ 客户端本地缓存实例列表，短期内还能调用；所以 Eureka 的 AP 设计是有意为之。但长期挂掉需要重建。
- 追问3：Nacos 和 Eureka 迁移？→ Spring Cloud 生态下，从 Eureka 切 Nacos 主要改 starter 和配置，业务代码改动小。

**常见误区：** 认为"CP 一定比 AP 好"。注册中心本身就是为了让业务调用可用，分区时坚持一致反而把业务拖死。Eureka 的 AP 设计在业务注册场景是合理的。

---

### 7. 限流算法

**Q：固定窗口、滑动窗口、漏桶、令牌桶四种限流算法区别？分布式限流怎么做？**

**解答：**

**1. 固定窗口计数器**：把时间分成固定窗口（如 1 分钟），窗口内计数超过阈值就拒绝。
- 缺点：**临界突刺**：窗口 0:59 打 100 个，1:00 又打 100 个，实际 2 秒内 200 个，超过阈值。

**2. 滑动窗口**：把窗口再细分（如 1 分钟 = 60 个 1s 小格），滑动统计最近 N 格。解决临界突刺，但仍有边界精度问题。Sentinel 用的就是滑动窗口。

**3. 漏桶（Leaky Bucket）**：请求进桶，桶以恒定速率漏出处理。桶满了拒绝。
- 特点：**强制流量平滑**，不管上游多陡，出口都是匀速。
- 缺点：突发流量无法利用桶的弹性。

**4. 令牌桶（Token Bucket）**：桶以恒定速率放令牌，请求必须拿到令牌才能通过；桶满时新令牌丢弃。
- 特点：允许一定程度突发（桶里攒了令牌，瞬间来一批可以一次性通过），同时长期平均速率受控。
- **Guava RateLimiter、Nginx limit_req、Sentinel 默认都是令牌桶思想**。

**分布式限流**：单机限流用 Guava；分布式需要共享计数，常见 Redis + Lua：
```lua
-- KEYS[1] = rate limit key, ARGV = rate, capacity, now, 1
local key = KEYS[1]
local rate = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local token = redis.call('hget', key, 'token')
local last = redis.call('hget', key, 'ts')
if not token then token = capacity; last = now end
local elapsed = math.max(0, now - last)
token = math.min(capacity, token + elapsed * rate)
local allowed = 0
if token >= 1 then token = token - 1; allowed = 1 end
redis.call('hmset', key, 'token', token, 'ts', now)
redis.call('expire', key, 10)
return allowed
```
Lua 保证读-算-写原子，避免并发超发。

**追问：**
- 追问1：漏桶和令牌桶怎么选？→ 需要绝对平滑（保护下游数据库）用漏桶；允许突发（用户体验好）用令牌桶。
- 追问2：Sentinel 的滑动窗口怎么实现？→ LeapArray 数组结构，每个 sample 窗口存滑动指标，O(1) 重置过期窗口。
- 追问3：限流阈值怎么定？→ 压测得出单机容量 × 可用实例数 × 0.8 安全余量，再根据下游容量反推。

**常见误区：** 用固定窗口做接口限流，被临界突刺打穿。另外，限流是"最后一道防线"，不是容量规划的替代。

---

### 8. 熔断降级

**Q：什么是熔断？Closed/Open/Half-Open 状态机怎么工作？熔断和限流有什么区别？**

**解答：** **熔断**（Circuit Breaker）是当下游服务错误率/延迟过高时，主动切断调用，防止故障扩散（雪崩）。就像家里保险丝，过载跳闸保护电器。

**三态状态机：**
- **Closed（关闭）**：正常放行。统计错误率，超过阈值（如 50%）切到 Open。
- **Open（打开）**：直接拒绝调用（fallback），不发请求。持续一段时间（如 5s）。
- **Half-Open（半开）**：时间到后放少量探测请求过去，成功则 Closed，失败则继续 Open。

**降级策略**：
- 返回兜底数据（缓存、默认值、"稍后再试"）。
- 异步化：把请求入队，后台慢慢处理。
- 关闭非核心功能（推荐、评论、个性化）保核心链路（下单、支付）。

**Hystrix**（Netflix，已停更）：线程池隔离 + 熔断 + 降级，每个下游一个线程池，故障隔离。
**Sentinel**（阿里，活跃）：滑动窗口统计 + 多种熔断策略（慢调用比例、异常比例、异常数）+ 流控 + 系统自适应保护。

**熔断 vs 限流：**
- **限流**：控制**入口流量**，防止自己被打垮。
- **熔断**：切断**出口依赖**，防止下游故障拖垮自己。
- 两者互补：限流挡上游，熔断挡下游。

**代码示例（Sentinel 定义降级规则）：**
```java
DegradeRule rule = new DegradeRule();
rule.setResource("queryOrder");
rule.setGrade(RuleConstant.DEGRADE_GRADE_EXCEPTION_RATIO); // 异常比例
rule.setCount(0.5);          // 异常率 > 50%
rule.setTimeWindow(10);      // 熔断 10s
rule.setMinRequestAmount(20); // 最小请求数
DegradeRuleManager.loadRules(Collections.singletonList(rule));
```

**追问：**
- 追问1：为什么会雪崩？→ A 调用 B 调用 C，C 慢/挂，B 的线程池全阻塞在等 C，B 也挂；A 调 B 也阻塞，连锁反应。熔断在 B 检测到 C 故障时直接失败快返回，不把自己线程耗光。
- 追问2：线程池隔离和信号量隔离？→ 线程池：每个下游独立线程池，隔离性好但切换开销大；信号量：计数器限制并发，轻量但不隔离（同一个 JVM 线程池仍会被拖慢）。
- 追问3：熔断打开时返回什么？→ 业务要定义 fallback：读缓存、返回默认值、友好提示。直接抛异常给用户体验差。

**常见误区：** 把熔断当"开关"，打开后忘记恢复。Half-Open 探测就是自动恢复机制；另外，熔断阈值不是越低越好——抖动期频繁熔断恢复反而增加抖动。

---

### 9. 一致性哈希

**Q：一致性哈希解决什么问题？虚拟节点是干嘛的？和普通取模有什么区别？**

**解答：** 普通分布式缓存用 `hash(key) % N` 选择节点。问题：节点 N 变化时，几乎所有 key 都要重新映射（N→N+1 时 90% key 迁移），缓存大面积失效，击穿 DB。

**一致性哈希**：把哈希空间组织成 **0 ~ 2^32-1 的环**。节点和 key 都 hash 到环上，key 顺时针找最近的节点。
- **节点增减时只影响相邻区间**：加一个节点只接管它到前一个节点之间的 key，其他 key 不动。
- 节点少时可能数据倾斜（某节点 hash 位置占了一大块环）。

**虚拟节点**：每个物理节点对应 N 个虚拟节点（如 100 个）散布在环上。数据先映射到虚拟节点，再映射到物理节点。
- 解决数据倾斜：物理节点在环上"分身"多，分布更均匀。
- 节点下线时，它负责的虚拟节点均匀散到其他节点，负载平滑迁移。

**适用场景**：分布式缓存分片（Memcached client 经典实现）、分布式存储的节点路由、负载均衡的会话粘滞。

**代码示例（伪代码）：**
```python
ring = {}  # hash(virtual_node) -> physical_node
vn_per_node = 100
for node in ["A", "B", "C"]:
    for i in range(vn_per_node):
        ring[hash(f"{node}#{i}")] = node

def get_node(key):
    h = hash(key)
    # 顺时针找第一个 >= h 的虚拟节点
    for vh in sorted(ring):
        if vh >= h: return ring[vh]
    return ring[sorted(ring)[0]]  # 环回到起点
```

**追问：**
- 追问1：一致性哈希就 0 数据迁移了吗？→ 不是，只迁移受影响区间；相比取模的"几乎全量迁移"已经好太多。
- 追问2：为什么不用 RANGE 分片？→ RANGE 按 key 范围分片，热点 key 集中在一个分片（如订单按时间范围，最近时间最热）；一致性哈希把热点打散。
- 追问3：Redis Cluster 用什么？→ Redis Cluster 不是一致性哈希，而是 **16384 个槽**，节点负责一段槽；槽位图全局广播。比一致性哈希更可控，槽迁移简单。

**常见误区：** 以为一致性哈希能自动故障转移。它只解决"路由映射变化小"，节点挂了之后数据要自己处理（复制副本、读兜底），一致性哈希不负责。

---

### 10. 微服务网关

**Q：微服务网关干什么？Spring Cloud Gateway、Kong、APISIX 各有什么特点？怎么做鉴权、限流、灰度？**

**解答：** **API 网关**是微服务集群的统一入口，所有外部请求先到网关，再路由到内部服务。核心职责：

1. **路由**：根据 URL、Header、Host 把请求转发到后端服务。
2. **鉴权**：统一校验 JWT/Session、API Key，下游服务不再重复鉴权。
3. **限流**：在网关层做全局限流，挡住恶意流量。
4. **熔断降级**：网关层聚合下游故障，返回兜底。
5. **灰度发布**：根据 Header/Cookie/用户 ID/权重把流量路由到新版本。
6. **日志监控**：统一访问日志、链路追踪 traceId 注入。
7. **协议转换**：外部 HTTP → 内部 gRPC/Dubbo。

**代表产品：**
- **Spring Cloud Gateway**：Java 系，和 Spring Cloud 生态无缝集成，开发简单，性能一般（JVM）。
- **Kong**：基于 Nginx + OpenResty（Lua），插件生态丰富，企业版强。
- **APISIX**：基于 Nginx + etcd，动态配置（无需 reload），性能高，国产开源，插件热加载。

**灰度发布实现：**
- 网关按规则路由：Header `x-canary: true` → 新版本；普通用户 → 老版本。
- 按权重：Nginx `split_clients` 或 APISIX traffic-split 插件，5% 流量到新版。
- 按用户标签：内部员工、白名单用户先体验。

**代码示例（Spring Cloud Gateway 路由 + 鉴权过滤器）：**
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
            - Header=x-canary, true   # 灰度规则
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter
              args: { redis-rate-limiter.replenishRate: 100, redis-rate-limiter.burstCapacity: 200 }
```

**追问：**
- 追问1：网关和负载均衡器（Nginx/LVS）区别？→ LVS/Nginx 是四层/七层流量分发；网关在七层之上做业务逻辑（鉴权、限流、转换）。生产中 LVS → Nginx → 网关 → 微服务。
- 追问2：网关自己会不会成瓶颈？→ 网关是有状态业务逻辑（鉴权、JWT 验签），性能不如纯 LVS。部署多实例 + 无状态化（鉴权信息放 JWT/Redis）即可水平扩展。
- 追问3：API 网关和 Service Mesh（Istio）关系？→ 网关是南北向入口；Mesh 是东西向服务间通信。两者互补，不冲突。

**常见误区：** 把网关当万能胶水，所有逻辑塞网关。网关应该薄（路由 + 横切关注点），业务逻辑下沉到服务；否则网关变成"巨石"，改一行代码全集群重启。

---
