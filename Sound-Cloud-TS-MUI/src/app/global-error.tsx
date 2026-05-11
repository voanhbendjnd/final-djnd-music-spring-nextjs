'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalError() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        const redirect = setTimeout(() => {
            router.push('/');
        }, 3000);

        return () => {
            clearInterval(timer);
            clearTimeout(redirect);
        };
    }, [router]);

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Not found any track!</h2>
            <p>Track non exists!</p>
            <p>Back home after {countdown} seconds...</p>
        </div>
    );
}