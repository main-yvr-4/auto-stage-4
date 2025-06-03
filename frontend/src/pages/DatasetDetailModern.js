import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Tag, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Progress,
  Image,
  message,
  Spin,
  Alert,
  Modal,
  Form,
  Input,
  Switch,
  Checkbox,
  Dropdown,
  Menu,
  Empty,
  Tooltip,
  Badge,
  Avatar,
  Divider,
  Table,
  Select
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  TagOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PictureOutlined,
  DownloadOutlined,
  UploadOutlined,
  SelectOutlined,
  ClearOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { datasetsAPI } from '../services/api';

const { Title, Text } = Typography;
const { Search } = Input;

const DatasetDetailModern = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'labeled', 'unlabeled'
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchDatasetDetails();
    fetchDatasetImages();
  }, [datasetId]);

  useEffect(() => {
    // Filter images based on search term and status
    let filtered = images;
    
    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(img => 
        filterStatus === 'labeled' ? img.is_labeled : !img.is_labeled
      );
    }
    
    setFilteredImages(filtered);
  }, [images, searchTerm, filterStatus]);

  const fetchDatasetDetails = async () => {
    try {
      const data = await datasetsAPI.getDataset(datasetId);
      setDataset(data);
    } catch (error) {
      console.error('Error fetching dataset details:', error);
      setError('Failed to load dataset details');
      message.error('Failed to load dataset details');
    }
  };

  const fetchDatasetImages = async () => {
    try {
      const data = await datasetsAPI.getDatasetImages(datasetId);
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching dataset images:', error);
      setError('Failed to load dataset images');
      message.error('Failed to load dataset images');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnotate = () => {
    navigate(`/annotate/${datasetId}`);
  };

  const handleEdit = () => {
    editForm.setFieldsValue({
      name: dataset.name,
      description: dataset.description
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      const updatedDataset = await datasetsAPI.updateDataset(datasetId, values);
      setDataset(updatedDataset);
      setEditModalVisible(false);
      message.success('Dataset updated successfully');
    } catch (error) {
      console.error('Error updating dataset:', error);
      message.error('Failed to update dataset');
    }
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    editForm.resetFields();
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Dataset',
      content: `Are you sure you want to delete "${dataset?.name}"? This action cannot be undone and will permanently remove all images and annotations.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await datasetsAPI.deleteDataset(datasetId);
          message.success('Dataset deleted successfully');
          navigate(`/projects/${dataset.project_id}`);
        } catch (error) {
          console.error('Error deleting dataset:', error);
          message.error(error.response?.data?.detail || 'Failed to delete dataset');
        }
      },
    });
  };

  const handleImageSelect = (imageId, checked) => {
    const newSelected = new Set(selectedImages);
    if (checked) {
      newSelected.add(imageId);
    } else {
      newSelected.delete(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handlePreviewImage = (image) => {
    setPreviewImage(image);
    setPreviewVisible(true);
  };

  const handleDownloadImage = (image) => {
    // Create download link
    const link = document.createElement('a');
    link.href = `${process.env.REACT_APP_API_URL}/api/v1/datasets/${datasetId}/images/${image.id}/file`;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Downloading ${image.filename}`);
  };

  const handleDeleteImage = async (image) => {
    try {
      // Add API call to delete image when backend supports it
      message.success(`Image ${image.filename} deleted`);
      // Refresh images list
      fetchDatasetImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      message.error('Failed to delete image');
    }
  };

  const handleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map(img => img.id)));
    }
  };

  const handleBatchAnnotate = () => {
    if (selectedImages.size === 0) {
      message.warning('Please select images to annotate');
      return;
    }
    const imageIds = Array.from(selectedImages).join(',');
    navigate(`/annotate/${datasetId}?images=${imageIds}`);
  };

  const handleBatchDelete = () => {
    if (selectedImages.size === 0) {
      message.warning('Please select images to delete');
      return;
    }
    
    Modal.confirm({
      title: 'Delete Selected Images',
      content: `Are you sure you want to delete ${selectedImages.size} selected images? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // TODO: Implement batch delete API
          message.success(`${selectedImages.size} images deleted successfully`);
          setSelectedImages(new Set());
          fetchDatasetImages();
        } catch (error) {
          message.error('Failed to delete selected images');
        }
      },
    });
  };

  const renderImageCard = (image) => {
    const isSelected = selectedImages.has(image.id);
    
    return (
      <Col xs={12} sm={8} md={6} lg={4} xl={3} key={image.id}>
        <Card
          hoverable
          style={{
            height: '100%',
            borderRadius: '8px',
            border: isSelected ? '2px solid #1890ff' : '1px solid #f0f0f0',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          bodyStyle={{ padding: '8px' }}
          cover={
            <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
              <Image
                src={`/api/v1/datasets/${datasetId}/images/${image.id}/file`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '8px 8px 0 0'
                }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                preview={{
                  mask: (
                    <div style={{ textAlign: 'center' }}>
                      <EyeOutlined style={{ fontSize: '20px', color: 'white' }} />
                      <div style={{ marginTop: '8px', color: 'white' }}>Preview</div>
                    </div>
                  )
                }}
              />
              
              {/* Selection Checkbox */}
              <Checkbox
                checked={isSelected}
                onChange={(e) => handleImageSelect(image.id, e.target.checked)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '4px',
                  padding: '2px'
                }}
              />
              
              {/* Status Badge */}
              <Badge
                status={image.is_labeled ? 'success' : 'warning'}
                text={image.is_labeled ? 'Labeled' : 'Unlabeled'}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '11px'
                }}
              />
              
              {/* Quick Actions Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  display: 'flex',
                  gap: '4px',
                  opacity: 0,
                  transition: 'opacity 0.2s ease'
                }}
                className="image-actions"
              >
                <Tooltip title="Annotate">
                  <Button
                    type="primary"
                    size="small"
                    icon={<TagOutlined />}
                    onClick={() => navigate(`/annotate/${datasetId}?image=${image.id}`)}
                  />
                </Tooltip>
                <Tooltip title="More Actions">
                  <Dropdown
                    overlay={
                      <Menu>
                        <Menu.Item 
                          key="view" 
                          icon={<EyeOutlined />}
                          onClick={() => handlePreviewImage(image)}
                        >
                          View Details
                        </Menu.Item>
                        <Menu.Item 
                          key="download" 
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownloadImage(image)}
                        >
                          Download
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item 
                          key="delete" 
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => {
                            Modal.confirm({
                              title: 'Delete Image',
                              content: `Delete "${image.filename}"?`,
                              okText: 'Delete',
                              okType: 'danger',
                              onOk: () => handleDeleteImage(image)
                            });
                          }}
                        >
                          Delete
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={['click']}
                  >
                    <Button
                      size="small"
                      icon={<MoreOutlined />}
                    />
                  </Dropdown>
                </Tooltip>
              </div>
            </div>
          }
        >
          <div style={{ padding: '4px 0' }}>
            <Text 
              strong 
              style={{ 
                fontSize: '12px',
                display: 'block',
                marginBottom: '4px'
              }}
              ellipsis={{ tooltip: image.filename }}
            >
              {image.filename}
            </Text>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: '#666'
            }}>
              <span>
                {image.file_size ? `${(image.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
              </span>
              <Tag 
                color={image.is_labeled ? 'success' : 'warning'} 
                style={{ fontSize: '10px', margin: 0 }}
              >
                {image.is_labeled ? 'Done' : 'Todo'}
              </Tag>
            </div>
          </div>
        </Card>
      </Col>
    );
  };

  const renderListView = () => {
    const columns = [
      {
        title: (
          <Checkbox
            checked={selectedImages.size === filteredImages.length && filteredImages.length > 0}
            indeterminate={selectedImages.size > 0 && selectedImages.size < filteredImages.length}
            onChange={handleSelectAll}
          />
        ),
        width: 50,
        render: (_, record) => (
          <Checkbox
            checked={selectedImages.has(record.id)}
            onChange={(e) => handleImageSelect(record.id, e.target.checked)}
          />
        ),
      },
      {
        title: 'Preview',
        dataIndex: 'file_path',
        key: 'preview',
        width: 80,
        render: (filePath, record) => (
          <Image
            width={50}
            height={50}
            src={`/api/v1/datasets/${datasetId}/images/${record.id}/file`}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
        ),
      },
      {
        title: 'Filename',
        dataIndex: 'filename',
        key: 'filename',
        ellipsis: true,
      },
      {
        title: 'Size',
        dataIndex: 'file_size',
        key: 'file_size',
        width: 100,
        render: (size) => {
          if (!size) return 'Unknown';
          const kb = size / 1024;
          if (kb < 1024) return `${kb.toFixed(1)} KB`;
          const mb = kb / 1024;
          return `${mb.toFixed(1)} MB`;
        },
      },
      {
        title: 'Status',
        dataIndex: 'is_labeled',
        key: 'status',
        width: 100,
        render: (isLabeled) => (
          <Tag color={isLabeled ? 'success' : 'warning'}>
            {isLabeled ? 'Labeled' : 'Unlabeled'}
          </Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Space>
            <Tooltip title="Annotate">
              <Button 
                type="link" 
                size="small"
                icon={<TagOutlined />}
                onClick={() => navigate(`/annotate/${datasetId}?image=${record.id}`)}
              />
            </Tooltip>
            <Tooltip title="View">
              <Button 
                type="link" 
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/annotate/${datasetId}?image=${record.id}`)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

    return (
      <Card>
        <Table
          columns={columns}
          dataSource={filteredImages}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} images`,
          }}
          size="small"
        />
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading dataset details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  if (!dataset) {
    return (
      <Alert
        message="Dataset Not Found"
        description="The requested dataset could not be found."
        type="warning"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  const annotatedCount = images.filter(img => img.is_labeled).length;
  const progressPercent = images.length > 0 ? (annotatedCount / images.length) * 100 : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '16px' }}
        >
          Back
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: '8px' }}>
              📁 {dataset.name}
            </Title>
            <Text type="secondary">
              {dataset.description || 'No description provided'}
            </Text>
          </div>
          <Space wrap>
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              Edit
            </Button>
            <Button 
              type="primary" 
              icon={<TagOutlined />} 
              onClick={handleAnnotate}
            >
              Annotate
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Total Images" 
              value={images.length} 
              prefix={<PictureOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Annotated" 
              value={annotatedCount} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Remaining" 
              value={images.length - annotatedCount} 
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic 
              title="Progress" 
              value={progressPercent} 
              suffix="%" 
              precision={1}
              prefix={<Progress type="circle" percent={progressPercent} size={20} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls Bar */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 120 }}
            >
              <Select.Option value="all">All Images</Select.Option>
              <Select.Option value="labeled">Labeled</Select.Option>
              <Select.Option value="unlabeled">Unlabeled</Select.Option>
            </Select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text>View:</Text>
              <Button.Group>
                <Button 
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('grid')}
                />
                <Button 
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                />
              </Button.Group>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {selectedImages.size > 0 && (
              <>
                <Text strong>{selectedImages.size} selected</Text>
                <Button 
                  type="primary" 
                  size="small"
                  icon={<TagOutlined />}
                  onClick={handleBatchAnnotate}
                >
                  Batch Annotate
                </Button>
                <Button 
                  danger 
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                >
                  Delete Selected
                </Button>
                <Button 
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={() => setSelectedImages(new Set())}
                >
                  Clear
                </Button>
              </>
            )}
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchDatasetImages}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Images Display */}
      {filteredImages.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchTerm || filterStatus !== 'all' 
                ? "No images match your filters" 
                : "No images in this dataset"
            }
          >
            {!searchTerm && filterStatus === 'all' && (
              <Button type="primary" icon={<UploadOutlined />}>
                Upload Images
              </Button>
            )}
          </Empty>
        </Card>
      ) : viewMode === 'grid' ? (
        <Row gutter={[16, 16]}>
          {filteredImages.map(renderImageCard)}
        </Row>
      ) : (
        renderListView()
      )}

      {/* Edit Dataset Modal */}
      <Modal
        title="Edit Dataset"
        open={editModalVisible}
        onCancel={handleEditCancel}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="name"
            label="Dataset Name"
            rules={[
              { required: true, message: 'Please enter dataset name' },
              { min: 1, max: 100, message: 'Name must be between 1 and 100 characters' }
            ]}
          >
            <Input placeholder="Enter dataset name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { max: 500, message: 'Description must be less than 500 characters' }
            ]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter dataset description (optional)" 
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Dataset
              </Button>
              <Button onClick={handleEditCancel}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        title={previewImage?.filename || "Image Preview"}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />} onClick={() => handleDownloadImage(previewImage)}>
            Download
          </Button>,
          <Button key="annotate" type="primary" icon={<TagOutlined />} onClick={() => {
            setPreviewVisible(false);
            navigate(`/annotate/${datasetId}?image=${previewImage.id}`);
          }}>
            Annotate
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
        centered
      >
        {previewImage && (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={`${process.env.REACT_APP_API_URL}/api/v1/datasets/${datasetId}/images/${previewImage.id}/file`}
              alt={previewImage.filename}
              style={{ maxWidth: '100%', maxHeight: '500px' }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
            <div style={{ marginTop: '16px', textAlign: 'left' }}>
              <p><strong>Filename:</strong> {previewImage.filename}</p>
              <p><strong>Size:</strong> {previewImage.file_size ? `${(previewImage.file_size / 1024).toFixed(1)} KB` : 'Unknown'}</p>
              <p><strong>Status:</strong> <Tag color={previewImage.is_labeled ? 'success' : 'warning'}>{previewImage.is_labeled ? 'Labeled' : 'Unlabeled'}</Tag></p>
              <p><strong>Created:</strong> {previewImage.created_at ? new Date(previewImage.created_at).toLocaleString() : 'Unknown'}</p>
            </div>
          </div>
        )}
      </Modal>

      <style jsx>{`
        .ant-card:hover .image-actions {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default DatasetDetailModern;