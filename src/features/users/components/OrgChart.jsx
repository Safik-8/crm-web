import React, { useMemo } from 'react';
import { User, ChevronRight, Mail } from 'lucide-react';

const OrgNode = ({ user, subordinates, onSelect, isSelected, isDeepestSelected }) => {
  const primaryRole = user.userRoles?.find(ur => ur.isPrimary) || user.userRoles?.[0];
  const roleName = primaryRole?.role?.name || 'MEMBER';
  
  const isSolid = isSelected && isDeepestSelected;
  const isPath = isSelected && !isDeepestSelected;

  return (
    <div className="relative group z-10">
      <div 
        onClick={() => onSelect(user.id)}
        className={`relative flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 w-64 md:w-[280px] backdrop-blur-md ${
          isSolid
            ? 'bg-gradient-to-br from-orange-500 to-amber-500 border-transparent shadow-lg shadow-orange-500/30 text-white transform scale-105 z-20' 
            : isPath 
              ? 'bg-orange-50 border-orange-200 shadow-md text-slate-900 z-10'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg text-slate-700 z-10'
        }`}
      >
        {/* Avatar */}
        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 transition-all duration-300 shadow-inner ${
          isSolid 
            ? 'bg-white/20 text-white ring-2 ring-white/30' 
            : 'bg-slate-100 text-slate-600 ring-2 ring-slate-50 group-hover:ring-orange-100'
        }`}>
          {user.firstName?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-[15px] leading-tight truncate tracking-tight">
            {user.name || `${user.firstName} ${user.lastName}`}
          </div>
          <div className="flex items-center mt-1.5">
             <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
               isSolid ? 'bg-white/20 text-white border-white/10' : 'bg-orange-100 text-orange-700 border-orange-200'
             }`}>
               {roleName.replace('_', ' ')}
             </span>
          </div>
          <div className={`text-[11px] truncate mt-1.5 flex items-center gap-1.5 font-medium ${isSolid ? 'text-white/90' : 'text-slate-500'}`}>
            <Mail size={12} className={isSolid ? 'text-orange-200' : 'text-slate-400'} />
            {user.email}
          </div>
        </div>
        
        {/* Expand Toggle Button */}
        {subordinates.length > 0 && (
          <div className={`absolute -right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full text-[10px] font-black shadow-sm transition-all duration-300 border ${
            isSolid 
              ? 'bg-white text-orange-600 border-white' 
              : isPath
              ? 'bg-orange-600 text-white border-orange-600'
              : 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900'
          }`}>
            <span>{subordinates.length}</span>
            <ChevronRight size={12} strokeWidth={3} className={isSolid ? 'text-orange-500 ml-0.5' : 'text-white ml-0.5'} />
          </div>
        )}
      </div>
    </div>
  );
};

const TreeNode = ({ user, subordinatesMap, selectedPath, onSelect }) => {
  const isSelected = selectedPath.includes(user.id);
  const isDeepestSelected = selectedPath[selectedPath.length - 1] === user.id;
  const children = subordinatesMap[user.id] || [];
  
  return (
    <div className="flex items-center">
      {/* Node Card */}
      <OrgNode 
        user={user} 
        subordinates={children} 
        onSelect={onSelect} 
        isSelected={isSelected}
        isDeepestSelected={isDeepestSelected}
      />

      {/* Children Container */}
      {isSelected && children.length > 0 && (
        <div className="relative flex flex-col gap-6 pl-10 py-2 ml-6">
          {/* Main Horizontal line from parent to the vertical branch */}
          <div className="absolute -left-6 top-1/2 w-6 h-[2px] bg-slate-300 -translate-y-1/2 z-0"></div>
          
          {/* Render children */}
          {children.map((child, idx) => (
             <div key={child.id} className="relative flex items-center">
                {/* Horizontal line from vertical branch to this child */}
                <div className="absolute -left-10 w-10 h-[2px] bg-slate-300 top-1/2 -translate-y-1/2 z-0"></div>
                
                {/* Vertical line extension for first/last children to connect to the center */}
                {children.length > 1 && idx === 0 && (
                  <div className="absolute -left-10 top-1/2 bottom-0 w-[2px] bg-slate-300 z-0"></div>
                )}
                {children.length > 1 && idx === children.length - 1 && (
                  <div className="absolute -left-10 top-0 bottom-1/2 w-[2px] bg-slate-300 z-0"></div>
                )}
                {children.length > 1 && idx > 0 && idx < children.length - 1 && (
                  <div className="absolute -left-10 top-0 bottom-0 w-[2px] bg-slate-300 z-0"></div>
                )}
                
                <TreeNode 
                   user={child} 
                   subordinatesMap={subordinatesMap} 
                   selectedPath={selectedPath} 
                   onSelect={onSelect} 
                />
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OrgChart = ({ users }) => {
  const [selectedPath, setSelectedPath] = React.useState([]);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  // Filter out SUPER_ADMIN
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const primaryRole = user.userRoles?.find(ur => ur.isPrimary) || user.userRoles?.[0];
      return primaryRole?.role?.name !== 'SUPER_ADMIN';
    });
  }, [users]);

  // Build hierarchy map
  const { topLevel, subordinatesMap } = useMemo(() => {
    const subs = {};
    const tops = [];
    
    filteredUsers.forEach(user => {
      subs[user.id] = [];
    });

    filteredUsers.forEach(user => {
      if (user.reportingManagerId && subs[user.reportingManagerId]) {
         if (user.id !== user.reportingManagerId) {
            subs[user.reportingManagerId].push(user);
         }
      } else {
        tops.push(user);
      }
    });

    return { topLevel: tops, subordinatesMap: subs };
  }, [filteredUsers]);

  // Auto-select first root node on initial data load
  React.useEffect(() => {
    if (topLevel.length > 0 && !hasInitialized) {
      setSelectedPath([topLevel[0].id]);
      setHasInitialized(true);
    }
  }, [topLevel, hasInitialized]);

  // Handle path selection logic
  const handleSelect = (userId) => {
    // Find the path to this user by traversing up the subordinatesMap
    const findPath = (targetId, currentPath = []) => {
       for (const topUser of topLevel) {
          if (topUser.id === targetId) return [topUser.id];
          const path = dfs(topUser.id, targetId, [topUser.id]);
          if (path) return path;
       }
       return [];
    };

    const dfs = (currentId, targetId, path) => {
       const children = subordinatesMap[currentId] || [];
       for (const child of children) {
          if (child.id === targetId) return [...path, child.id];
          const found = dfs(child.id, targetId, [...path, child.id]);
          if (found) return found;
       }
       return null;
    };

    const newPath = findPath(userId);
    
    // Toggle logic: If clicking the same deepest node, close it (go to its parent)
    if (selectedPath[selectedPath.length - 1] === userId) {
       setSelectedPath(newPath.slice(0, -1));
    } else {
       setSelectedPath(newPath);
    }
  };

  if (users.length === 0) return (
     <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-slate-200 border-dashed m-6">
       <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
         <User size={24} className="text-slate-300" />
       </div>
       <p className="text-slate-500 font-bold text-base">No users available for Org Chart.</p>
       <p className="text-slate-400 text-sm mt-1 font-medium">Add users and establish reporting lines to see the hierarchy.</p>
     </div>
  );

  return (
    <div className="bg-[#f8f9fa] p-8 md:p-12 rounded-[2rem] border border-slate-200/60 shadow-sm overflow-x-auto overflow-y-hidden min-h-[600px] relative touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col gap-12 min-w-max">
         {topLevel.map(user => (
            <TreeNode 
              key={user.id} 
              user={user} 
              subordinatesMap={subordinatesMap} 
              selectedPath={selectedPath} 
              onSelect={handleSelect} 
            />
         ))}
      </div>
    </div>
  );
};

export default OrgChart;
