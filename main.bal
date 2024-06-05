1                    import vm;
2 
3
4         function main(string... args) {
5  
6    vm:Instruction[] program = [
7      new(vm:ICONST, 30),
8      new(vm:ICONST, 20),
9      new(vm:IADD),
10      new(vm:PRINT),
11        new(vm:ICONST, 10),
 12       new(vm:ISUB),
 13     new(vm:PRINT),
 14    new(vm:HALT)
 15          ];
 16
17    vm:execute(program);
 18        }
