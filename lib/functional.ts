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
export const truthy = x => x !== false && x!=null;
export const doWhen = (cond, action) => truthy(cond) ? action() : undefined;
export const invoker = (NAME, METHOD) => {
  return (target, ...args) => {
    if (!existy(target)) throw new Error('Must provide a target');
    let targetMethod = target[NAME];
    return doWhen((existy(targetMethod) && METHOD === targetMethod), () => targetMethod.apply(target, ...args))
  }
}
(function() {

  // TODO: Optimizations opportunity: actually, just use pipelining for this!
  // If needed, provide actions that do not produce intermediate results to
  // reduce cost of method. This would work potentially in the buffer + offset
  // case, by directly updating the offset instead of returning the new offset.

  exports.invoker = function invoker (NAME, METHOD) {
    return function(target /* args ... */) {
      if (!existy(target)) throw new Error('Must provide a target');

      var targetMethod = target[NAME];
      var args = _.rest(arguments);

      return doWhen((existy(targetMethod) && METHOD === targetMethod), function() {
        return targetMethod.apply(target, args);
      });
    };
  };

  // Merge converts _.extend into a pure function. Instead of using the first
  // argument as the target object, it instead sticks a local empty object
  // into the front of _.extend’s arguments and mutate that instead.
  exports.merge = function(/*args*/) {
    return _.extend.apply(null, construct({}, arguments));
  };

  exports.dispatch = function(/* funs */) {
    var funs = _.toArray(arguments);
    var size = funs.length;

    return function(target /*, args */) {
      var ret;
      var args = _.rest(arguments);

      for (var funIndex = 0; funIndex < size; funIndex++) {
        var fun = funs[funIndex];
        ret = fun.apply(fun, construct(target, args));

        if (existy(ret)) return ret;
      }

      return ret;
    };
  };

  exports.isa = function(type, action) {
    return function(obj) {
      if (type === obj)
        return action(obj);
    }
  }

}.call(this));
