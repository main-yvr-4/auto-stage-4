import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Button, Typography, Alert, Spin } from 'antd';
import { 
  ProjectOutlined, 
  PictureOutlined, 
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, modelsAPI, checkBackendHealth } from '../services/api';

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState({ available: false });
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalImages: 0,
    labeledImages: 0,
    modelsAvailable: 0,
    activeJobs: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [models, setModels] = useState([]);

  // Check backend health and load data
  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Check backend health first
      const healthStatus = await checkBackendHealth();
      setBackendStatus(healthStatus);
      
      if (!healthStatus.available) {
        setLoading(false);
        return;
      }

      // Load projects data
      const projectsData = await projectsAPI.getProjects(0, 10);
      setRecentProjects(projectsData.slice(0, 5)); // Show only first 5

      // Load models data
      const modelsData = await modelsAPI.getModels();
      setModels(modelsData);

      // Calculate statistics from projects data
      const totalProjects = projectsData.length;
      const totalImages = projectsData.reduce((sum, project) => sum + project.total_images, 0);
      const labeledImages = projectsData.reduce((sum, project) => sum + project.labeled_images, 0);

      setStats({
        totalProjects,
        totalImages,
        labeledImages,
        modelsAvailable: modelsData.length,
        activeJobs: 0 // TODO: Implement jobs tracking
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setBackendStatus({ 
        available: false, 
        error: { message: 'Failed to connect to backend' }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const labelingProgress = stats.totalImages > 0 
    ? Math.round((stats.labeledImages / stats.totalImages) * 100) 
    : 0;

  // Show backend connection error
  if (!backendStatus.available) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <Title level={2}>Dashboard</Title>
        <Alert
          message="Backend Connection Error"
          description={
            <div>
              <p>{backendStatus.error?.message || 'Cannot connect to the backend server.'}</p>
              <p>Please make sure the backend is running on port 12000.</p>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={loadDashboardData}
                style={{ marginTop: '8px' }}
              >
                Retry Connection
              </Button>
            </div>
          }
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading dashboard data...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>Dashboard</Title>
          <Paragraph>
            Welcome to Auto-Labeling-Tool - Your local computer vision dataset labeling solution
          </Paragraph>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadDashboardData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>
      
      {/* Backend Status */}
      <Alert
        message="Backend Connected"
        description="Successfully connected to Auto-Labeling backend"
        type="success"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Models"
              value={stats.modelsAvailable}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Projects"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Images"
              value={stats.totalImages}
              prefix={<PictureOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Progress and Models */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Overall Labeling Progress" extra={<Text>{labelingProgress}% Complete</Text>}>
            {stats.totalImages > 0 ? (
              <>
                <Progress 
                  percent={labelingProgress} 
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">
                    {stats.labeledImages} of {stats.totalImages} images labeled
                  </Text>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <PictureOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">No images uploaded yet</Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Available Models" extra={<Text>{stats.modelsAvailable} Models</Text>}>
            {models.length > 0 ? (
              <List
                dataSource={models.slice(0, 3)} // Show first 3 models
                renderItem={model => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      title={model.name}
                      description={`${model.type} • ${model.classes?.length || 0} classes`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <ClockCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">No models available</Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Projects and Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="Recent Projects" 
            extra={<Button type="link" onClick={() => navigate('/projects')}>View All</Button>}
          >
            {recentProjects.length > 0 ? (
              <List
                dataSource={recentProjects}
                renderItem={project => {
                  const progress = project.total_images > 0 
                    ? Math.round((project.labeled_images / project.total_images) * 100) 
                    : 0;
                  
                  return (
                    <List.Item
                      actions={[
                        <Button type="link" icon={<PlayCircleOutlined />} onClick={() => navigate(`/projects/${project.id}`)}>
                          Open
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<ProjectOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
                        title={project.name}
                        description={`${project.total_images} images • ${project.type || 'Object Detection'}`}
                      />
                      <div style={{ minWidth: '120px' }}>
                        <Progress percent={progress} size="small" />
                        <Text type="secondary">{progress}% labeled</Text>
                      </div>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <ProjectOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">No projects created yet</Text>
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Quick Actions"
            extra={<PlusOutlined />}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button 
                type="primary" 
                icon={<ProjectOutlined />}
                onClick={() => navigate('/projects')}
                block
              >
                Create New Project
              </Button>
              <Button 
                icon={<RobotOutlined />}
                onClick={() => navigate('/models')}
                block
              >
                Manage Models
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;