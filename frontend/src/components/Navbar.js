import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  RobotOutlined,
  ProjectOutlined
} from '@ant-design/icons';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/models',
      icon: <RobotOutlined />,
      label: 'Models',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <div style={{ 
        color: 'white', 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginRight: '40px',
        marginLeft: '24px'
      }}>
        🏷️ Auto-Labeling-Tool
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ flex: 1, minWidth: 0 }}
      />
    </div>
  );
};

export default Navbar;