import { isFunction } from './baseHandler'
import { ReactiveEffect } from './effect'

class ComputedRefImpl {
  public effect;
  public _dirty = true;
  public __v_isReadonly = true;
  public __v_isRef = true;
  public _value;
  constructor(getter, public setter) {
    // 我们将用户的getter放到effect中，传进来的属性会被effect收集起来
    this.effect = new ReactiveEffect(getter, () => {
      // 稍后依赖的属性变化会执行此调度函数
    })

  }
}