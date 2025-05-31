import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const { user } = useUser();
    const { getToken } = useAuth();

    // Configure axios defaults
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    const [searchFilter, setSearchFilter] = useState({
        title: '',
        location: ''
    });

    const [isSearched, setIsSearched] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);
    const [companyToken, setCompanyToken] = useState(null);
    const [companyData, setCompanyData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [userApplications, setUserApplications] = useState(null);

    // Function to Fetch Jobs data
    const fetchJobs = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/jobs`);
            if (data.success) {
                setJobs(data.jobs);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // Function to fetch Company Data
    const fetchCompanyData = async () => {
        try {
            if (!companyToken) {
                console.log('No company token available');
                return;
            }

            const response = await axios.get(`${backendUrl}/api/company/company`, {
                headers: { 
                    Authorization: `Bearer ${companyToken}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });

            const data = response.data;
            if (data.success) {
                setCompanyData(data.company);
            } else {
                toast.error(data.message || 'Failed to fetch company data');
                // If token is invalid, clear it
                if (data.message && (data.message.includes('Invalid token') || data.message.includes('Not authorized'))) {
                    setCompanyToken(null);
                    localStorage.removeItem('companyToken');
                    setCompanyData(null);
                }
            }
        } catch (error) {
            console.error('Error fetching company data:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch company data';
            toast.error(errorMessage);
            
            // If token is invalid, clear it
            if (error.response?.status === 401) {
                setCompanyToken(null);
                localStorage.removeItem('companyToken');
                setCompanyData(null);
            }
        }
    };

    // Function to fetch User Data
    const fetchUserData = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/users/user`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            
            if (data.success) {
                setUserData(data.user);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Function to fetch User's Applied data
    const fetchUserApplications = async () => {
        try {
            const token = await getToken();
            console.log('Fetching user applications...');
            
            const { data } = await axios.get(`${backendUrl}/api/users/applications`, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });

            console.log('Applications response:', data);

            if (data.success) {
                // Ensure we're getting an array of applications
                const applications = Array.isArray(data.applications) ? data.applications : [];
                setUserApplications(applications);
                console.log('Set applications:', applications);
            } else {
                console.error('Failed to fetch applications:', data.message);
                toast.error(data.message || 'Failed to fetch applications');
                setUserApplications([]);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to fetch applications');
            setUserApplications([]);
        }
    };

    useEffect(() => {
        fetchJobs();

        const storedCompanyToken = localStorage.getItem('companyToken');

        if (storedCompanyToken) {
            setCompanyToken(storedCompanyToken);
        }
    }, []);

    useEffect(() => {
        if (companyToken) {
            fetchCompanyData();
        }
    }, [companyToken]);

    useEffect(() => {
        if (companyData) {
            const storedCompanyData = JSON.stringify(companyData);
            localStorage.setItem('companyData', storedCompanyData);
        }
    }, [companyData]);

    useEffect(() => {
        const storedCompanyData = localStorage.getItem('companyData');
        if (storedCompanyData) {
            setCompanyData(JSON.parse(storedCompanyData));
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserData();
            fetchUserApplications();
        }
    }, [user]);
    

    const value = {
        searchFilter, setSearchFilter,
        setIsSearched, isSearched,
        jobs, setJobs,
        setShowRecruiterLogin, showRecruiterLogin,
        companyToken, setCompanyToken,
        companyData, setCompanyData,
        backendUrl, 
        userData, setUserData,
        userApplications, setUserApplications,
        fetchUserData,
        fetchUserApplications
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}