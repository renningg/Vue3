import { ReactiveEffect } from "./effect";
import { isReactive } from './reactive'
import { isFunction } from './baseHandler'
// 判断是否为对象 
export const isObject = (item) => {
  return typeof item === 'object' ? true : false;
}

// 考虑如果对象中有循环引用的问题
function traversal(value, set = new Set()) {
  // 第一步递归要有终结条件，不是对象就不再递归
  if (!isObject(value)) return value;
  if (set.has(value)) return value;
  set.add(value);
  for (let key in value) {
    traversal(value[key], set)
  }
  return value
}
// source 是用户传进来的对象，cb 就是对应用户的回调
export function watch(source, cb) {
  let getter;
  if (isReactive(source)) {
    // 对我们用户传入的数据进行循环 
    // （递归循环，只要循环和就会访问对象上的每一个属性，访问属性的时候就会收集effect）
    getter = () => traversal(source)
  } else if (isFunction(source)) {
    getter = source
  } else return

  let cleanup;
  const onCleanup = (fn) => {
    // 保存用户的函数
    cleanup = fn;
  }
  let oldValue;
  const job = () => {
    if (cleanup) {
      cleanup()
    }
    const newValue = effect.run();
    cb(newValue, oldValue, onCleanup);
    oldValue = newValue
  }
  // 在effect中属性就会被依赖收集
  // 监控自己构造的函数，变化后重新执行job
  const effect = new ReactiveEffect(getter, job)
  oldValue = effect.run();
}