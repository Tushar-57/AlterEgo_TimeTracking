import AudioVisualizer from '../components/AudioVisualizer';
import InterfaceOverlay from '../components/InterfaceOverlay';
import SettingsModal from '../components/SettingsModal';

const Home = () => {
  return (
    <div className="bg-black text-white h-screen w-screen overflow-hidden">
      <AudioVisualizer />
      <InterfaceOverlay />
      <SettingsModal />
    </div>
  );
};

export default Home;
