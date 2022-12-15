declare module '*.css' {
  interface IClassNames {
    use: () => void;
    unuse: () => void;
  }
  const classNames: IClassNames;
  export = classNames;
}
