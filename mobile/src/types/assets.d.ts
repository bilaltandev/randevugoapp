// Images imported as modules resolve to a numeric asset id in React Native.
declare module '*.png' {
  const asset: number;
  export default asset;
}
