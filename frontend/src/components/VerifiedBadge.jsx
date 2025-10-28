import { BsPatchCheckFill } from 'react-icons/bs';

const VerifiedBadge = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  return (
    <BsPatchCheckFill
      className={`text-blue-500 inline-block ${sizes[size]} ${className}`}
      title="Verified Account"
    />
  );
};

export default VerifiedBadge;
