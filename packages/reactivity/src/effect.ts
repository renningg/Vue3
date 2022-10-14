// 原理：
// 1，先搞了一个响应式对象，new Proxy
// 2，effect 默认数据变化要能更新，我们先将正在执行的effect
// 作为全局变量，渲染（取值），我们在get方法中进行依赖手机
// 3，weakMap(对象：map(属性：set(effect)))
// 4，稍后用户发生数据变化，会通过对象属性来查找对应的effect集合，找到effect全部执行。

export let activeEffect = undefined;
function cleanupEffect(effect) {
  // deps装的是name对应的effect,age对应的effect
  const { deps } = effect;
  for (let index = 0; index < deps.length; index++) {
    // 解除effect，重新依赖收集
    // 数组里面放集合，拿出数组里每一项的集合去删除
    deps[index].delete(effect)
  }
  effect.deps.length = 0;
}
export class ReactiveEffect {
  // 这里表示在实力上新增了active属性
  public active = true;//默认激活状态
  public parent = null;
  public deps = [];
  constructor(public fn, public scheduler) { } //用户传递的参数也会放到this上 this.fn = fn
  // run就是执行effect
  run() {
    // 如果是非激活状态，只需执行函数，不需要进行依赖收集
    if (!this.active) this.fn();
    // 这里就要依赖收集，核心就是将当前的effect 和 稍后渲染的属性关联在一起
    try {
      this.parent = activeEffect
      activeEffect = this;
      // 当稍后调用取值操作的时候，就可以获取到这个全局的activeEffect
      // 这里需要在执行用户函数之前将之前收集的内容清空
      cleanupEffect(this)
      return this.fn();
    } finally {
      activeEffect = this.parent;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      // 停止收集effect
      cleanupEffect(this);

    }
  }
}

// 这里fn可以根据状态变化 重新执行， effect可以嵌套着写
export function effect(fn, options: any = {}) {
  // 创建响应式的effect
  const _effect = new ReactiveEffect(fn, options.scheduler)
  // 默认先执行一次
  _effect.run();
  // 绑定this执行
  const runner = _effect.run.bind(_effect)
  // 将effect挂载到runner函数上
  runner.effect = _effect
  return runner
}

const targetMap = new WeakMap()
export function track(target, type, key) {
  if (!activeEffect) return;
  // 第一次没有
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  // 去重了
  let shouldTrack = !dep.has(activeEffect)
  if (shouldTrack) {
    dep.add(activeEffect)
    // 存放的是属性对应的set,让effect记录住对应的dep，稍后清理的时候会用到
    activeEffect.deps.push(dep)

  }
}

export function trigger(target, type, key, value, oldVaue) {
  const depsMap = targetMap.get(target)
  //  触发的值不在模板中使用
  if (!depsMap) return;
  // 找到了属性对应的effect
  let effects = depsMap.get(key)  //找到了属性对应的effect
  // 永远在执行之前 先拷贝一份来执行 不要关联引用
  if (effects) {
    effects = new Set(effects)
    effects.forEach(effect => {
      // 在执行effect时，又要执行自己，那需要屏蔽掉，不要无限调用
      if (effect !== activeEffect) {
        if (effect.scheduler) {
          // 如果用户传入了调度函数，则用用户的
          effect.scheduler();
          // 否则刷新视图
        } else effect.run();
      }
    });
  }

}