import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout,
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Space,
  Spin,
  message,
  Progress,
  Tabs,
  Input,
  Tag,
  Avatar,
  Divider,
  Empty,
  Tooltip
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  FileImageOutlined,
  TagOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { datasetsAPI } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Sider, Content } = Layout;
const { TextArea } = Input;

const AnnotateProgress = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [dataset, setDataset] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [instructions, setInstructions] = useState('');
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [tempInstructions, setTempInstructions] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const imagesPerPage = 50;

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
        const response = await datasetsAPI.getDataset(datasetId);
        setDataset(response);
        setInstructions(response.description || 'Click edit to add annotation instructions...');
        setTempInstructions(response.description || '');
      } catch (error) {
        console.error('Error loading dataset:', error);
        message.error('Failed to load dataset information');
        // Fallback dataset info
        setDataset({
          id: datasetId,
          name: `Dataset ${datasetId}`,
          description: 'Dataset ready for annotation',
          total_images: 0,
          labeled_images: 0,
          unlabeled_images: 0,
          created_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    loadDataset();
  }, [datasetId, navigate]);

  // Load images with pagination
  useEffect(() => {
    const loadImages = async () => {
      if (!datasetId) return;

      setImagesLoading(true);
      try {
        // Load more images to handle filtering on client side
        const response = await datasetsAPI.getDatasetImages(datasetId, 0, 1000);
        setImages(response.images || []);

      } catch (error) {
        console.error('Error loading images:', error);
        message.error('Failed to load images');
        setImages([]);
      } finally {
        setImagesLoading(false);
      }
    };

    loadImages();
  }, [datasetId]);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Filter images based on active tab
  const allFilteredImages = images.filter(image => {
    if (activeTab === 'labeled') return image.is_labeled;
    if (activeTab === 'unlabeled') return !image.is_labeled;
    return true; // 'all' tab
  });

  // Paginate filtered images
  const startIndex = (currentPage - 1) * imagesPerPage;
  const endIndex = startIndex + imagesPerPage;
  const filteredImages = allFilteredImages.slice(startIndex, endIndex);
  const totalFilteredImages = allFilteredImages.length;

  // Calculate progress
  const totalImagesCount = images.length;
  const labeledImages = images.filter(img => img.is_labeled).length;
  const progressPercentage = totalImagesCount > 0 ? Math.round((labeledImages / totalImagesCount) * 100) : 0;

  // Handle image click
  const handleImageClick = (imageId) => {
    navigate(`/annotate/${datasetId}/manual?imageId=${imageId}`);
  };

  // Handle instructions edit
  const handleEditInstructions = () => {
    setEditingInstructions(true);
    setTempInstructions(instructions);
  };

  const handleSaveInstructions = async () => {
    try {
      await datasetsAPI.updateDataset(datasetId, { description: tempInstructions });
      setInstructions(tempInstructions);
      setEditingInstructions(false);
      message.success('Instructions updated successfully');
    } catch (error) {
      console.error('Error updating instructions:', error);
      message.error('Failed to update instructions');
    }
  };

  const handleCancelEdit = () => {
    setEditingInstructions(false);
    setTempInstructions(instructions);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color and icon
  const getImageStatus = (image) => {
    if (image.is_labeled) {
      return {
        color: '#52c41a',
        icon: <CheckCircleOutlined />,
        text: 'Labeled',
        tag: 'success'
      };
    } else {
      return {
        color: '#faad14',
        icon: <ExclamationCircleOutlined />,
        text: 'Unlabeled',
        tag: 'warning'
      };
    }
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

  const tabItems = [
    {
      key: 'all',
      label: `All Images (${totalImagesCount})`,
      children: null
    },
    {
      key: 'labeled',
      label: `Annotated (${labeledImages})`,
      children: null
    },
    {
      key: 'unlabeled',
      label: `Unannotated (${totalImagesCount - labeledImages})`,
      children: null
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Left Sidebar */}
      <Sider 
        width={320} 
        style={{ 
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          zIndex: 1
        }}
      >
        <div style={{ padding: '24px' }}>
          {/* Back Button */}
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleGoBack}
            style={{ marginBottom: 24 }}
            type="text"
          >
            Back to Launcher
          </Button>

          {/* Dataset Metadata */}
          <Card 
            size="small" 
            style={{ marginBottom: 24 }}
            title={
              <Space>
                <FileImageOutlined style={{ color: '#1890ff' }} />
                <Text strong>Dataset Info</Text>
              </Space>
            }
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Name:</Text>
                <br />
                <Text strong>{dataset?.name}</Text>
              </div>
              <div>
                <Text type="secondary">Created:</Text>
                <br />
                <Space>
                  <CalendarOutlined style={{ color: '#666' }} />
                  <Text>{formatDate(dataset?.created_at)}</Text>
                </Space>
              </div>
              <div>
                <Text type="secondary">Assigned User:</Text>
                <br />
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text>Current User</Text>
                </Space>
              </div>
            </Space>
          </Card>

          {/* Timeline/Progress Section */}
          <Card 
            size="small" 
            style={{ marginBottom: 24 }}
            title={
              <Space>
                <TagOutlined style={{ color: '#52c41a' }} />
                <Text strong>Progress Timeline</Text>
              </Space>
            }
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Total Images:</Text>
                <br />
                <Text strong style={{ fontSize: '18px' }}>{totalImagesCount}</Text>
              </div>
              <div>
                <Text type="secondary">Completion:</Text>
                <br />
                <Progress 
                  percent={progressPercentage} 
                  size="small"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  {labeledImages} of {totalImagesCount} images annotated
                </Text>
              </div>
            </Space>
          </Card>

          {/* Instructions Section */}
          <Card 
            size="small"
            title={
              <Space>
                <EditOutlined style={{ color: '#722ed1' }} />
                <Text strong>Annotation Instructions</Text>
              </Space>
            }
            extra={
              !editingInstructions ? (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<EditOutlined />}
                  onClick={handleEditInstructions}
                >
                  Edit
                </Button>
              ) : (
                <Space>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<SaveOutlined />}
                    onClick={handleSaveInstructions}
                  >
                    Save
                  </Button>
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CloseOutlined />}
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </Space>
              )
            }
          >
            {editingInstructions ? (
              <TextArea
                value={tempInstructions}
                onChange={(e) => setTempInstructions(e.target.value)}
                placeholder="Enter annotation instructions..."
                rows={4}
                style={{ resize: 'none' }}
              />
            ) : (
              <Paragraph 
                style={{ 
                  margin: 0, 
                  minHeight: '60px',
                  color: instructions.includes('Click edit') ? '#999' : '#333'
                }}
              >
                {instructions}
              </Paragraph>
            )}
          </Card>
        </div>
      </Sider>

      {/* Main Content */}
      <Content style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
              🎯 Annotation Progress
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Track your annotation progress and manage image labeling
            </Text>
          </div>
          
          {/* Add Images Button - Show when all images are annotated */}
          {dataset && dataset.labeled_images === dataset.total_images && dataset.total_images > 0 && (
            <Button 
              type="primary" 
              size="large"
              icon={<PlusOutlined />}
              onClick={() => {
                // Navigate to add images page or show upload modal
                message.info('Add Images functionality - to be implemented');
              }}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
              }}
            >
              Add Images to Dataset
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[24, 16]} align="middle">
            <Col span={16}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong style={{ fontSize: '16px' }}>
                  Overall Progress: {labeledImages} / {totalImagesCount} annotated
                </Text>
                <Progress 
                  percent={progressPercentage} 
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  style={{ marginBottom: 0 }}
                />
              </Space>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Space size="large">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {labeledImages}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Labeled</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                    {totalImagesCount - labeledImages}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Remaining</div>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Tabs and Image Grid */}
        <Card>
          <Tabs 
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
          
          <Divider style={{ margin: '16px 0' }} />

          {/* Image Grid */}
          {imagesLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>Loading images...</div>
            </div>
          ) : filteredImages.length === 0 ? (
            <Empty
              description={
                activeTab === 'all' 
                  ? "No images found in this dataset"
                  : activeTab === 'labeled'
                  ? "No labeled images yet"
                  : "No unlabeled images remaining"
              }
              style={{ padding: '40px' }}
            />
          ) : (
            <>
              <Row gutter={[24, 24]}>
                {filteredImages.map((image) => {
                  const status = getImageStatus(image);
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} xl={4} key={image.id}>
                      <Card
                        hoverable
                        style={{ 
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: `2px solid ${status.color}20`,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        bodyStyle={{ padding: 0 }}
                        onClick={() => handleImageClick(image.id)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = `0 12px 32px ${status.color}30`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Image */}
                        <div style={{ 
                          height: 200, 
                          background: '#f5f5f5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          {image.url ? (
                            <img 
                              src={image.url} 
                              alt={image.filename}
                              style={{ 
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div style={{ 
                            display: image.url ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: '#999'
                          }}>
                            <FileImageOutlined style={{ fontSize: '48px' }} />
                          </div>
                          
                          {/* Status Badge */}
                          <div style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 8,
                            padding: '4px 8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}>
                            <Tag color={status.tag} style={{ margin: 0, border: 'none', fontWeight: 'bold' }}>
                              {status.text}
                            </Tag>
                          </div>
                        </div>

                        {/* Image Info */}
                        <div style={{ padding: '16px' }}>
                          <Tooltip title={image.original_filename || image.filename}>
                            <Text 
                              strong 
                              style={{ 
                                fontSize: '14px',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginBottom: '4px'
                              }}
                            >
                              {image.original_filename || image.filename}
                            </Text>
                          </Tooltip>
                          <Text 
                            type="secondary" 
                            style={{ fontSize: '12px' }}
                          >
                            {image.width} × {image.height}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              {/* Pagination */}
              {totalFilteredImages > imagesPerPage && (
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '32px',
                  padding: '24px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <Space size="large">
                    <Button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      size="large"
                    >
                      ← Previous
                    </Button>
                    
                    <Text style={{ fontSize: '16px' }}>
                      Page {currentPage} of {Math.ceil(totalFilteredImages / imagesPerPage)}
                    </Text>
                    
                    <Button 
                      disabled={currentPage >= Math.ceil(totalFilteredImages / imagesPerPage)}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      size="large"
                    >
                      Next →
                    </Button>
                  </Space>
                  
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary">
                      Showing {((currentPage - 1) * imagesPerPage) + 1} - {Math.min(currentPage * imagesPerPage, totalFilteredImages)} of {totalFilteredImages} images
                    </Text>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </Content>


    </Layout>
  );
};

export default AnnotateProgress;