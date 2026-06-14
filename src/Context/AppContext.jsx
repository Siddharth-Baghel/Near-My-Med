import { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();
export const useAppContext = () => {
    return useContext(AppContext);
     
};
export default function AppProvider({ children }) {
    const navigate = useNavigate();

    function handleNavigation(path) {
        navigate(path);
    }
    
    return (
        <AppContext.Provider value={{ handleNavigation }}>
            {children}
        </AppContext.Provider>
    );
}