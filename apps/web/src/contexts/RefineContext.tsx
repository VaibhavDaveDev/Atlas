'use client';

import React from 'react';
import { Refine } from '@refinedev/core';
import dataProvider from '@refinedev/simple-rest';
import routerProvider from '@refinedev/nextjs-router';
import axios from 'axios';
import { useAuth } from './AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_BASE = `${API_URL}/api/v1`;

const axiosInstance = axios.create({
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const workspaceRaw = localStorage.getItem('workspace');
    if (workspaceRaw && workspaceRaw !== 'undefined' && config.headers) {
      try {
        const workspace = JSON.parse(workspaceRaw);
        if (workspace?.workspaceId) {
          config.headers['x-workspace-id'] = workspace.workspaceId;
        }
      } catch (e) {
        console.error('RefineContext: Failed to parse workspace', e);
      }
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    // If the response has our standard wrapper, unwrap it for Refine
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      // console.log('RefineContext: Unwrapping response data');
      const unwrappedData = response.data.data;
      
      // Refine's simple-rest data provider requires 'x-total-count' header for lists
      if (Array.isArray(unwrappedData)) {
        response.headers = response.headers || {};
        response.headers['x-total-count'] = unwrappedData.length.toString();
      }

      return {
        ...response,
        data: unwrappedData,
      };
    }
    return response;
  },
  (error) => {
    console.error('RefineContext: API Error:', error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

export const RefineProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuth();

  const baseDataProvider = dataProvider(API_BASE, axiosInstance);
  
  const customDataProvider = {
    ...baseDataProvider,
    getList: async ({ resource }: any) => {
      try {
        const url = `${API_BASE}/${resource}`;
        const { data } = await axiosInstance.get(url);
        // data here is already unwrapped by the interceptor
        return {
          data: data,
          total: data.length || 0,
        };
      } catch (error) {
        console.error("Custom dataProvider getList error:", error);
        throw error;
      }
    }
  };

  return (
    <Refine
      dataProvider={customDataProvider}
      routerProvider={routerProvider}
      authProvider={{
        login: async () => ({ success: true }),
        logout: async () => {
          await logout();
          return { success: true };
        },
        check: async () => ({ authenticated: !!user }),
        onError: async (error) => {
          console.error(error);
          return { error };
        },
        getPermissions: async () => null,
        getIdentity: async () => user,
      }}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      {children}
    </Refine>
  );
};
