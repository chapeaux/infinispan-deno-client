export const existy = (x:any) => x!=null;
export const cat = (...args) => [...args];
export const construct = (head, ...tail) => [head,...tail];
export const _partial = (fun, ...args) => fun(...args);
export const pipeline = (seed, ...args) => [...args].reduce((a,c) => a(c),seed);
export const curry = (fun, ...args) => fun(...args);
export const greaterThan = curry((lhs,rhs) => lhs>rhs);
export const lessThan = curry((lhs,rhs) => lhs<rhs);
export const lift = (answerFx, stateFx, ...args) => {
  return (state) => {
    return {
      answer: answerFx(state, ...args),
      state: stateFx ? stateFx(state) : answerFx(state, ...args)
    };
  }
};
export const actions = (acts, done) => {
  return (seed) => {
    let intermediate = acts.reduce((a,c)=> {
      return {
        values: [...a.values,...c(a.state).answer],
        state: c(a.state).state
      };
    },{ values: [], state: seed});
    
    return done(intermediate.values.filter(v=>v!=null), intermediate.state);
  };
};
export const mapcat = (fun, coll) => coll.map(fun);
export const condition1 = (...args) => {
  return (fun, arg) => {
    let errors = mapcat((isValid)=> {
      return isValid(arg) ? [] : [typeof isValid.message ==='function' ? isValid.message.apply(arg) : isValid.message];
    }, [...args]);

    if (!errors) {
      throw new Error(errors.join(', '));
    }
    return fun(arg);
  }
}
export const validator = (message, fun) => {
  let f = (...args) => fun(...args);
  f['message'] = message;
  return f;
};
export const truthy = x => { return (x !== false && x!=null); };
export const doWhen = (cond, action) => truthy(cond) ? action() : undefined;
export const invoker = (NAME, METHOD) => {
  return (target, ...args) => {
    if (!existy(target)) throw new Error('Must provide a target');
    let targetMethod = target[NAME];
    return doWhen((existy(targetMethod) && METHOD === targetMethod), () => targetMethod.apply(target, ...args))
  }
}
export const merge = (...args) => Object.assign(...args);
export const dispatch = (...funs) => {
  return (target, ...args) {
    let ret;
    for (let funIndex =0; funIndex < funs.length; funIndex++) {
      let fun = funs[funIndex];
      ret = fun.apply(fun, [target, ...args])

      if (ret != null) return ret;
    }
    return ret;
  }
};
export const isa = (type, action) => {
  return (obj) => type === obj ? action(obj) : undefined;
}