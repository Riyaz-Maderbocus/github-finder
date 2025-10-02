import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import UserCard from "./UserCard";
import { fetchGithubUser, searchGithubUser } from "../api/github";
import RecentSearches from "./RecentSearches";
import { useDebounce } from "use-debounce";
import type { GitHubUser } from "../types";
import SuggestionDropdown from "./SuggestionDropdown";

const UserSearch = () => {
    const [userName, setUserName] = useState("");
    const [submittedUserName, setSubmittedUserName] = useState("");
    const [recentUsers, setRecentUsers] = useState<string[]>(()=>{
        const stored = localStorage.getItem("recentUsers");
        return stored ? JSON.parse(stored) : []
    });

    const [debouncedUserName] = useDebounce(userName, 300);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Query to fetch specific user
    const {data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["users", submittedUserName],
        queryFn: ()=> {
             return fetchGithubUser(submittedUserName)
        },
        enabled: !!submittedUserName
    })

    // Query to fetch suggestions for user search
        const {data:suggestions} = useQuery({
        queryKey: ["github-user-suggestion", debouncedUserName],
        queryFn: ()=> {
             return searchGithubUser(debouncedUserName)
        },
        enabled: debouncedUserName.length > 1
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = userName.trim();
        if (!trimmed) return;
        setSubmittedUserName(trimmed);
        setUserName("");
        setRecentUsers((prev)=> {
            const updated = [trimmed, ...prev.filter((user) => user !== trimmed)];
            return updated.slice(0,5);
        })
    }

    useEffect(()=> {
        localStorage.setItem("recentUsers", JSON.stringify(recentUsers))
    }, [recentUsers])


    return ( 
        <>
            <form className="form" onSubmit={handleSubmit}>
                <div className="dropdown-wrapper">
                    <input type="text" placeholder="Enter Github Username..." 
                    value={userName} 
                    onChange={(e)=> {
                    const val = e.target.value;
                    setUserName(val)
                    setShowSuggestions(val.trim().length> 1)}}/>
                    {showSuggestions &&  suggestions?.length >0 && (
                        <SuggestionDropdown suggestions={suggestions} show={showSuggestions} 
                        onSelect={(selected)=> {
                            setUserName(selected);
                            setShowSuggestions(false);

                            if(submittedUserName !== selected)  {
                                setSubmittedUserName(selected)
                            } else {
                                refetch()
                            }
                            setRecentUsers((prev)=> {
                                const updated = [selected, ...prev.filter((user) => user !== selected)];
                                return updated.slice(0,5);
                            })
                              
                        }
                        }/>
                        // <ul className="suggestions">
                        //     {suggestions.slice(0,5).map((user:GitHubUser)=> (
                        //         <li key={user.login}
                        //         onClick={()=> {
                        //             setUserName(user.login);
                        //             setShowSuggestions(false);
                        //             if(submittedUserName !== user.login) {
                        //                 setSubmittedUserName(user.login)
                        //             } else {
                        //                 refetch()
                        //             }
                        //         }}>
                        //             <img className="avatar-xs" src={user.avatar_url} alt={user.login} />
                        //             {user.login}
                        //         </li>
                        //     ))}
                        // </ul>
                    )}
                </div>
                <button type="submit">Search</button>
            </form>

            {isLoading && <p className="status">Loading...</p>}
            {isError && <p className="status error">{error.message}</p>}
            {data && <UserCard user={data}/>}

            {recentUsers.length > 0 && (
                <RecentSearches users={recentUsers} onSelect={(userName)=>{
                    setUserName(userName);
                    setSubmittedUserName(userName);
                }}/>
            )} 
        </>
     );
}
 
export default UserSearch;