// pages/index.tsx

import { useState } from 'react';

export default function Home() {
    const [staff_pass_id, setStaffPassId] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    const handleRedeem = async () => {
        try {
            const response = await fetch('/api/redemption', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ staff_pass_id }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`Redemption is successful by ${data.team_name} team`);
            } else {
                setMessage(data.error || 'Failed to redeem');
            }
        } catch (error) {
            console.error('Error redeeming gift:', error);
            setMessage('Internal server error');
        }
    };

    return (
        <div>
            <h1>Redemption Form</h1>
            <div>
                <label>
                    Staff Pass ID:
                    <input type="text" value={staff_pass_id} onChange={(e) => setStaffPassId(e.target.value)} />
                </label>
                <button onClick={handleRedeem}>Redeem Gift</button>
            </div>
            {message && <p>{message}</p>}
        </div>
    );
}
