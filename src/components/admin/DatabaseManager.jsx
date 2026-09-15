import { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import adminService from '../../services/admin.service';
import { AuthContext } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { userRole } from '../../config';
import toast from 'react-hot-toast';
import AuthService from "../../services/auth.service.js";

export default function DatabaseManager() {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { openPassword } = useModal();
    const navigate = useNavigate();
    
    const [isVerified, setIsVerified] = useState(false);
    const [tables, setTables] = useState([]);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tablesLoading, setTablesLoading] = useState(true);

    const hasPrompted = useRef(false);

    useEffect(() => {
        if (user?.role !== userRole.Owner) {
            navigate('/control-panel');
            return;
        }

        const verifyAccess = async () => {
            if (hasPrompted.current) return;
            hasPrompted.current = true;

            const password = await openPassword(t('admin.danger_zone_creator'), t('common.security'), t('action.confirm'));
            
            if (!password) {
                navigate('/control-panel');
                return;
            }

            const res = await AuthService.verifyPassword(password);
            if (res) {
                setIsVerified(true);
            } else {
                toast.error(res.message || t('admin.query_failed'));
                navigate('/control-panel');
            }
        };

        if (!isVerified) {
            verifyAccess();
        }
    }, [user, navigate, t, isVerified, openPassword]);

    useEffect(() => {
        if (!isVerified) return;

        const fetchTables = async () => {
            try {
                const response = await adminService.getDatabaseTables();
                if (response.success) {
                    setTables(response.data || []);
                } else {
                    toast.error(response.message || t('admin.error_loading_data'));
                }
            } catch (error) {
                toast.error(t('api.error.ERR_NETWORK'));
            } finally {
                setTablesLoading(false);
            }
        };

        fetchTables();
    }, [isVerified, t]);

    const executeQuery = async () => {
        if (!query.trim()) {
            toast.error(t('admin.enter_query'));
            return;
        }

        if (!query.trim().toUpperCase().startsWith('SELECT')) {
            toast.error(t('admin.only_select_queries'));
            return;
        }

        setLoading(true);
        setResults(null);

        try {
            const response = await adminService.executeDbQuery(query);
            if (response.success) {
                setResults(response.data);
                toast.success(t('admin.query_success'));
            } else {
                toast.error(response.message || t('admin.query_failed'));
            }
        } catch (error) {
            toast.error(t('api.error.ERR_NETWORK'));
        } finally {
            setLoading(false);
        }
    };

    const handleTableClick = (tableName) => {
        setQuery(`SELECT * FROM ${tableName} LIMIT 50;`);
    };

    const renderResultsTable = () => {
        if (!results) return null;
        if (!Array.isArray(results)) {
            return <pre className="admin-db-results-raw">{JSON.stringify(results, null, 2)}</pre>;
        }
        if (results.length === 0) return <p>{t('admin.zero_rows')}</p>;

        const columns = Object.keys(results[0]);

        return (
            <div className="admin-db-results-table-wrap">
                <table className="admin-db-results-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((row, index) => (
                            <tr key={index}>
                                {columns.map(col => (
                                    <td key={col}>
                                        {row[col] !== null ? String(row[col]) : <em className="tetrone-text-muted">null</em>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (!isVerified) {
        return (
            <div className="admin-db-manager">
                <div className="admin-db-loading-wrap" style={{ gridColumn: '1 / -1' }}>
                    <div className="tetrone-loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-db-manager">
            {/* Sidebar with tables */}
            <div className="admin-db-sidebar">
                <h3 className="admin-db-sidebar-title">{t('admin.database_tables')}</h3>
                {tablesLoading ? (
                    <div className="tetrone-loading-spinner"></div>
                ) : (
                    <ul className="admin-db-table-list">
                        {tables.map(table => {
                            const tableName = typeof table === 'string' ? table : (table.name || table.Tables_in_database || Object.values(table)[0]);
                            return (
                                <li key={tableName}>
                                    <button 
                                        className="admin-db-table-btn"
                                        onClick={() => handleTableClick(tableName)}
                                    >
                                        {tableName}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            <div className="admin-db-main">
                <div className="admin-db-editor-card">
                    <div className="admin-db-editor-header">
                        <h3>{t('admin.sql_editor')}</h3>
                        <span className="admin-db-danger-text">{t('admin.danger_zone_creator')}</span>
                    </div>
                    <textarea 
                        className="admin-db-textarea"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="SELECT * FROM users LIMIT 10;"
                    />
                    <div className="admin-db-action-row">
                        <button 
                            onClick={executeQuery} 
                            disabled={loading || !query.trim()}
                            className="tetrone-btn tetrone-btn-primary"
                        >
                            {loading ? t('common.loading') : t('admin.run_query')}
                        </button>
                    </div>
                </div>

                <div className="admin-db-results-card">
                    <h3>{t('admin.results')}</h3>
                    {loading ? (
                        <div className="admin-db-loading-wrap">
                            <div className="tetrone-loading-spinner"></div>
                        </div>
                    ) : (
                        renderResultsTable()
                    )}
                </div>
            </div>
        </div>
    );
}
