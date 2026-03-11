import AppShell from '../components/AppShell';
import '../styles/globals.css';

export const metadata = {
    title: 'Gravity Systems | Employee Management',
    description: 'Compliance and employee tracing dashboard',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AppShell>{children}</AppShell>
            </body>
        </html>
    );
}
