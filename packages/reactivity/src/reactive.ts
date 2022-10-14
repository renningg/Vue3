import {ReactiveFlags, mutableHandlers} from './baseHandler'

// 判断是否为对象 
export const isObject = (item) => {
  return typeof item === 'object' ? true : false;
}
// 将数据转换成响应式数据,只能做对象的代理
const reactiveMap = new WeakMap(); //key只能是对象
//实现同一个对象 代理多次 但会同一个代理
// 代理对象被再次代理  可以直接返回 

export function isReactive(value){
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}
export function reactive(target) {
  if (!isObject(target)) return;
  if (target[ReactiveFlags.IS_REACTIVE]) return target;
  // 并没有重新定义属性，只是代理，在取值的时候会调用get，当赋值的时候调用set
  let exitingProxy = reactiveMap.get(target)
  if (exitingProxy) return exitingProxy;
  // 第一次普通对象代理，我们会通过new Proxy代理一次
  // 下一次传递的proxy 查看是否被代理过，如果访问这个proxy有get方法，证明被访问过
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy)
  return proxy;
}