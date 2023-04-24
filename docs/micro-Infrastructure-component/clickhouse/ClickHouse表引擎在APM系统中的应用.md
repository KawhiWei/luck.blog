+ # ClickHouse表引擎在APM系统中的应用

## Clickhouse 中ReplicatedMergeTree   和ReplacingMergeTree的区别
ReplicatedMergeTree和ReplacingMergeTree都是ClickHouse中用于处理分布式数据的存储引擎，它们之间的区别在于：

1. 处理冲突的方式不同：ReplicatedMergeTree在写入冲突时使用日志来记录冲突，然后通过运行合并操作来解决冲突。ReplacingMergeTree则会直接使用最新的数据来覆盖旧数据。

2. ReplicatedMergeTree支持数据复制：ReplicatedMergeTree是具有冗余备份和数据自动复制的存储引擎，它可以将数据自动复制到其他节点。而ReplacingMergeTree不支持自动数据复制。

3. 数据写入方式的不同：ReplicatedMergeTree需要使用INSERT INTO… SELECT语句将数据写入，而ReplacingMergeTree则可以使用INSERT语句插入数据。

总之，ReplicatedMergeTree更适合需要具备冗余备份和数据自动复制的高可用性系统；而ReplacingMergeTree适用于需要高效的数据插入以及直接使用最新数据的系统。







## ！！ClickHouse使用ReplicatedMergeTree创建一张表，请给我SQL语句
```
CREATE TABLE myTable
(
   id UInt64,
   name String,
   created_at DateTime
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/myTable', '{replica}')
PARTITION BY toYYYYMMDD(created_at)
ORDER BY id;
```

- `myTable`是表名。
- `id`, `name`, `created_at`是要创建的列名。
- `ReplicatedMergeTree`是引擎名，这种引擎类型数据具有强一致性，适用于分布式场景。
- `/clickhouse/tables/{shard}/myTable`是表的存储路径，其中`{shard}`是分片号，`{replica}`是副本号。
- `PARTITION BY toYYYYMMDD(created_at)`是按照日期分区，以便在查询时提高效率。
- `ORDER BY id`是根据id排序。

注意：在使用ReplicatedMergeTree作为表的引擎时，需要在ClickHouse配置文件中配置相关的分片和副本信息。



## ClickHouse使用ReplicatedMergeTree创建表需要配置macros策略吗？

使用ReplicatedMergeTree创建表需要配置macros策略。它可以用于指定数据复制和分区策略。当为ReplicatedMergeTree表创建macros时，必须首先将存储引擎指定为ReplicatedMergeTree。以下是一个示例SQL语句：

```
CREATE TABLE my_table (
    date Date,
    event String,
    value Float64
) ENGINE = ReplicatedMergeTree('/clickhouse/tables/{layer}-{shard}/my_table', '{replica}')
PARTITION BY (toYYYYMM(date))
ORDER BY (date)
SETTINGS index_granularity = 8192;
```

其中，`{layer}`和`{shard}`是macros，代表分布式系统的层数和分片号，`{replica}`是备份数量。使用这些macros可以方便地指定分区和数据复制策略。


## APM系统存储Trace数据，Clickhouse应该使用那种引擎

ReplicatedMergeTree和ReplacingMergeTree都可以在ClickHouse中用于存储APM系统的Trace数据。这两种引擎的区别在于数据的去重和更新方式。

- ReplicatedMergeTree引擎：该引擎支持数据去重和数据更新。该引擎适合存储需要去重和更新数据的场景，比如存储APM系统的Trace数据时，需要去重相同Trace，并更新Trace的状态信息。
- ReplacingMergeTree引擎：该引擎支持数据去重，但不支持数据更新。该引擎适合存储数据不需要更新的场景，比如存储日志数据。

因此，在存储APM系统的Trace数据时，可以考虑使用ReplicatedMergeTree引擎，以便去重和更新Trace数据。

