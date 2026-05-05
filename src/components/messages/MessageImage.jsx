import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext'; 

export default function SecureImage({ src, alt, className }) {
    const [imgSrc, setImgSrc] = useState(null);
    const [error, setError] = useState(false);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (!src) return;

        let objectUrl = null;

        const fetchImage = async () => {
            try {
                const response = await fetch(src, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    objectUrl = URL.createObjectURL(blob);
                    setImgSrc(objectUrl);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Fetch error:", err);
                setError(true);
            }
        };

        fetchImage();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [src, token]);

    if (error) {
        return <div className={`tetrone-image-error ${className}`}></div>;
    }

    if (!imgSrc) {
        return <div className={`tetrone-image-loading ${className}`}></div>;
    }

    return <img src={imgSrc} alt={alt} className={className} />;
}