var newset = new Set();

const a = {'a': 1}

newset.add(a);

a['a'] = 2;

console.log(newset.has('1'))