import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { ApiAtom } from '../state';

export default function useExtension() {
  const apiUrl = useRecoilValue(ApiAtom);

  const get = useCallback(async (endPoint: string) => {
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/${endPoint}`);
      const data = await response.json();
      return data;
    }
  }, [apiUrl]);

  const post = useCallback(async (endPoint: string, apiData: any, fetchResponse: boolean = true) => {
    if (apiUrl) {
      const response = await fetch(`${apiUrl}/${endPoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(apiData)
      });
      if (fetchResponse) {
        const data = await response.json();
        return data;
      }
      return;
    }
  }, [apiUrl]);

  return {
    get,
    post
  };
}