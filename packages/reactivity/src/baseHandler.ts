import { track, trigger } from './effect'
import { isObject, reactive } from './reactive'
// 判断是否为函数
export const isFunction = (item) => {
  return typeof item === 'function'
}
// 判断是否为字符串
export const isString = (item) => {
  return typeof item === 'string'
}
// 判断是否为数字
export const isNumber = (item) => {
  return typeof item === 'number'
}

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const mutableHandlers = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) return true;
    track(target, 'get', key)
    // 去代理上对象取值，就走set
    // 这里可以监控用到户取值了
    let res = Reflect.get(target, key, receiver)
    //  深度代理
    if (isObject(res)) {
      return reactive(res)
    }
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      // 值变化了要更新
      trigger(target, 'set', key, value, oldValue)
    }
    // 去代理上设置值，执行set
    // 这里可以监控用到户取值了
    return result
  },
}

