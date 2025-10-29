// images.d.ts

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
   const value: any;
   export default value;
}

declare module '*.gif' {
   const value: any;
   export default value;
}

// 필요하다면 다른 이미지 확장자도 추가하세요 (svg, webp 등)