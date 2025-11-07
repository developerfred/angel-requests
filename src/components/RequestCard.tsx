import React from 'react';
import { AngelRequest } from '../types';
import { Heart, MessageCircle, User } from 'lucide-react';

interface RequestCardProps {
    request: AngelRequest;
    onTip: (request: AngelRequest) => void;
    onViewDetails: (request: AngelRequest) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
    request,
    onTip,
    onViewDetails
}) => {
    const progress = (parseFloat(request.currentAmount) / parseFloat(request.targetAmount)) * 100;

    return (
        <div className="request-card">
            <div className="request-header">
                <div className="creator-info">
                    <User size={16} />
                    <span className="basename">@{request.basename}</span>
                </div>
                <div className={`status-badge ${request.status}`}>
                    {request.status}
                </div>
            </div>

            <h3 className="request-title" onClick={() => onViewDetails(request)}>
                {request.title}
            </h3>

            <p className="request-description">
                {request.description}
            </p>

            <div className="progress-section">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
                <div className="progress-stats">
                    <span>{request.currentAmount} ETH</span>
                    <span>{request.targetAmount} ETH</span>
                </div>
            </div>

            <div className="request-footer">
                <div className="tip-info">
                    <Heart size={16} />
                    <span>{request.tips.length} tips</span>
                </div>

                <div className="action-buttons">
                    <button
                        className="btn-secondary"
                        onClick={() => onViewDetails(request)}
                    >
                        <MessageCircle size={16} />
                        Details
                    </button>

                    <button
                        className="btn-primary"
                        onClick={() => onTip(request)}
                    >
                        <Heart size={16} />
                        Tip
                    </button>
                </div>
            </div>
        </div>
    );
};