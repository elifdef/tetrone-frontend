import { useState, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { SocketProvider } from './SocketProvider';
import { ChatProvider } from './ChatProvider';
import { NotificationProvider } from './NotificationProvider';
import { ModalProvider } from './ModalProvider';

interface AppProvidersProps {
    children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        refetchOnWindowFocus: false,
                        staleTime: 1000 * 60,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ThemeProvider>
                    <AuthProvider>
                        <SocketProvider>
                            <ChatProvider>
                                <NotificationProvider>
                                    <ModalProvider>{children}</ModalProvider>
                                </NotificationProvider>
                            </ChatProvider>
                        </SocketProvider>
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </QueryClientProvider>
    );
};
