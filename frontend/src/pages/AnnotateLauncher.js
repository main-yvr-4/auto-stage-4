import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Space,
  Spin,
  message,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons';
import { datasetsAPI } from '../services/api';

const { Title, Paragraph } = Typography;

const AnnotateLauncher = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load dataset information
  useEffect(() => {
    const loadDataset = async () => {
      if (!datasetId) {
        message.error('Dataset ID is required');
        navigate('/projects');
        return;
      }

      setLoading(true);
      try {
        // Try to get dataset info from API
        const response = await datasetsAPI.getDataset(datasetId);
        setDataset(response);
      } catch (error) {
        console.error('Error loading dataset:', error);
        // If API fails, use a fallback with the dataset ID
        setDataset({
          id: datasetId,
          name: `Dataset ${datasetId}`,
          description: 'Dataset ready for annotation'
        });
      } finally {
        setLoading(false);
      }
    };

    loadDataset();
  }, [datasetId, navigate]);

  const handleManualLabeling = () => {
    navigate(`/annotate-progress/${datasetId}`);
  };

  const handleAutoLabeling = () => {
    navigate(`/annotate/${datasetId}/auto`);
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: 800, width: '100%' }}>
        {/* Back Button */}
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleGoBack}
          style={{ 
            marginBottom: 24,
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white'
          }}
          size="large"
        >
          Back
        </Button>

        {/* Main Card */}
        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: 'none'
          }}
          bodyStyle={{ padding: '48px 40px' }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Title level={1} style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 16
            }}>
              🎯 How do you want to label your images?
            </Title>
            
            {dataset && (
              <div style={{ marginBottom: 24 }}>
                <Title level={4} style={{ color: '#666', margin: 0 }}>
                  Dataset: {dataset.name}
                </Title>
                {dataset.description && (
                  <Paragraph style={{ color: '#999', margin: 0 }}>
                    {dataset.description}
                  </Paragraph>
                )}
              </div>
            )}
            
            <Paragraph style={{ 
              fontSize: '1.1rem', 
              color: '#666',
              maxWidth: 600,
              margin: '0 auto'
            }}>
              Choose your preferred annotation method to start labeling your dataset images.
            </Paragraph>
          </div>

          <Divider style={{ margin: '32px 0' }} />

          {/* Annotation Options */}
          <Row gutter={[32, 32]} justify="center">
            {/* Manual Labeling Option */}
            <Col xs={24} md={12}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: 12,
                  border: '2px solid #f0f0f0',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                bodyStyle={{ 
                  padding: '32px 24px',
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onClick={handleManualLabeling}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1890ff';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(24, 144, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#f0f0f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ 
                    fontSize: '4rem', 
                    marginBottom: 16,
                    background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    📝
                  </div>
                  <Title level={3} style={{ marginBottom: 16 }}>
                    Manual Labeling
                  </Title>
                  <Paragraph style={{ color: '#666', marginBottom: 24 }}>
                    Draw bounding boxes and polygons manually with full control over every annotation. 
                    Perfect for precise labeling and quality assurance.
                  </Paragraph>
                  <Space direction="vertical" size="small">
                    <div style={{ color: '#52c41a' }}>✓ Full precision control</div>
                    <div style={{ color: '#52c41a' }}>✓ Custom annotation tools</div>
                    <div style={{ color: '#52c41a' }}>✓ Quality assurance</div>
                  </Space>
                </div>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<UserOutlined />}
                  style={{ 
                    marginTop: 24,
                    height: 48,
                    borderRadius: 8,
                    fontWeight: 'bold'
                  }}
                  block
                >
                  Start Manual Labeling
                </Button>
              </Card>
            </Col>

            {/* Auto Labeling Option */}
            <Col xs={24} md={12}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderRadius: 12,
                  border: '2px solid #f0f0f0',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                bodyStyle={{ 
                  padding: '32px 24px',
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onClick={handleAutoLabeling}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#52c41a';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(82, 196, 26, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#f0f0f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ 
                    fontSize: '4rem', 
                    marginBottom: 16,
                    background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    🤖
                  </div>
                  <Title level={3} style={{ marginBottom: 16 }}>
                    Auto Labeling
                  </Title>
                  <Paragraph style={{ color: '#666', marginBottom: 24 }}>
                    Let AI automatically detect and label objects in your images. 
                    Fast and efficient for large datasets with manual review options.
                  </Paragraph>
                  <Space direction="vertical" size="small">
                    <div style={{ color: '#52c41a' }}>✓ AI-powered detection</div>
                    <div style={{ color: '#52c41a' }}>✓ Batch processing</div>
                    <div style={{ color: '#52c41a' }}>✓ Manual refinement</div>
                  </Space>
                </div>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<ThunderboltOutlined />}
                  style={{ 
                    marginTop: 24,
                    height: 48,
                    borderRadius: 8,
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                    border: 'none'
                  }}
                  block
                >
                  Start Auto Labeling
                </Button>
              </Card>
            </Col>
          </Row>

          {/* Additional Info */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: 48,
            padding: '24px',
            background: '#f8f9fa',
            borderRadius: 8
          }}>
            <Paragraph style={{ margin: 0, color: '#666' }}>
              💡 <strong>Tip:</strong> You can switch between manual and auto labeling modes at any time during the annotation process.
            </Paragraph>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnnotateLauncher;