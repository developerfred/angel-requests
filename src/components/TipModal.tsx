import React, { useState } from 'react';
import { AngelRequest } from '../types';
import { X, Send } from 'lucide-react';

interface TipModalProps {
    request: AngelRequest | null;
    isOpen: boolean;
    onClose: () => void;
    onTip: (amount: string, message: string) => void;
}

export const TipModal: React.FC<TipModalProps> = ({
    request,
    isOpen,
    onClose,
    onTip
}) => {
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');

    if (!isOpen || !request) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount && parseFloat(amount) > 0) {
            onTip(amount, message);
            setAmount('');
            setMessage('');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h2>Tip @{request.basename}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="request-preview">
                    <h3>{request.title}</h3>
                    <p>{request.description}</p>
                </div>

                <form onSubmit={handleSubmit} className="tip-form">
                    <div className="form-group">
                        <label htmlFor="amount">Amount (ETH)</label>
                        <input
                            type="number"
                            id="amount"
                            step="0.001"
                            min="0.0001"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.001"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Message (Optional)</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Support this amazing work!"
                            rows={3}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            <Send size={16} />
                            Send Tip
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};