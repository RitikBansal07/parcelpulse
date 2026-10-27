import React from 'react';
import { Platform } from 'react-native';
import { LiveMapProps } from './LiveMap.native';
import LiveMapNative from './LiveMap.native';
import LiveMapWeb from './LiveMap.web';

export const LiveMap: React.FC<LiveMapProps> = (props) => {
  if (Platform.OS === 'web') {
    return <LiveMapWeb {...props} />;
  }
  return <LiveMapNative {...props} />;
};

export default LiveMap;

