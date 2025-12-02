declare module 'react-usa-map' {
  import { FC } from 'react';

  interface USAMapProps {
    customize?: { [stateCode: string]: { fill?: string } };
    onClick?: (event: any) => void;
    width?: number;
    height?: number;
    title?: string;
    defaultFill?: string;
  }

  const USAMap: FC<USAMapProps>;
  export default USAMap;
}
