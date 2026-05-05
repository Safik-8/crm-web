import { useEffect } from 'react';
import { useLoader } from '../../../shared/context/LoaderContext';

const CustomersPage = () => {
  const { forceHideLoader } = useLoader();

  useEffect(() => {
    const timer = setTimeout(() => {
      forceHideLoader();
    }, 100);

    return () => clearTimeout(timer);
  }, [forceHideLoader]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Customers</h1>
      <p className="mt-2 text-gray-600">This is the Customers page placeholder.</p>
    </div>
  );
};

export default CustomersPage;
