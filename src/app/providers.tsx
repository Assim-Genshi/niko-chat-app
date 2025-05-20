import { HeroUIProvider } from '@heroui/react';
import { ToastProvider } from '@heroui/toast';
import { AuthProvider } from '../contexts/AuthContext';

// 显式指定 children 的类型为 ReactNode
const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <HeroUIProvider>
            <ToastProvider />
            <AuthProvider>
                {children}
            </AuthProvider>
        </HeroUIProvider>
    );
};

export default Providers;
