import { Server } from '@frontmatter/common';
import { useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { ApiAtom } from '../state';
import useWebviewMessage from './useWebviewMessage';

export default function useLocalApiPort() {
  const { message, sendMessage } = useWebviewMessage();
  const [ apiPort, setApiPort ] = useState<string | null>(null);
  const [ , setApi ] = useRecoilState(ApiAtom);

  useEffect(() => {
    sendMessage(null, "api");
  }, []);

  useEffect(() => {
    if (message?.apiPort) {
      setApiPort(message.apiPort || null);
      setApi(`${Server.host}:${message.apiPort}`);
    }
  }, [message]);

  return {
    apiPort
  };
}