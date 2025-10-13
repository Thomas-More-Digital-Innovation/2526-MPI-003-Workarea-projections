import Popup from '../components/Popup';

export default function Page() {
  return (
    <div className="flex flex-col items-center space-y-4 mt-10">
      <Popup popupType="removeImage"/>
    </div>
  );
}