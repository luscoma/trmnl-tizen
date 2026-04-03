// Returns property name as the class name so styles.foo === "foo"
export default new Proxy(
  {},
  { get: (_target, prop) => String(prop) },
);
