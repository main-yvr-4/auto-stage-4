import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Table, 
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
  Input
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  TagOutlined
} from '@ant-design/icons';
import { datasetsAPI } from '../services/api';

const { Title, Text } = Typography;

const DatasetDetail = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchDatasetDetails();
    fetchDatasetImages();
  }, [datasetId]);

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
      setImages(data.images || []); // Extract the images array from the response
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

  const imageColumns = [
    {
      title: 'Preview',
      dataIndex: 'file_path',
      key: 'preview',
      width: 100,
      render: (filePath, record) => (
        <Image
          width={60}
          height={60}
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
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size) => {
        if (!size) return 'Unknown';
        const kb = size / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
      },
    },
    {
      title: 'Annotations',
      dataIndex: 'is_labeled',
      key: 'annotations',
      render: (isLabeled) => (
        <Tag color={isLabeled ? 'green' : 'orange'}>
          {isLabeled ? 'Labeled' : 'Not Labeled'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_labeled',
      key: 'status',
      render: (isLabeled) => (
        <Tag color={isLabeled ? 'success' : 'warning'}>
          {isLabeled ? 'Annotated' : 'Not Annotated'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/annotate/${datasetId}?image=${record.id}`)}
          >
            View
          </Button>
          <Button 
            type="link" 
            icon={<TagOutlined />}
            onClick={() => navigate(`/annotate/${datasetId}?image=${record.id}`)}
          >
            Annotate
          </Button>
        </Space>
      ),
    },
  ];

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
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          style={{ marginBottom: '16px' }}
        >
          Back
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            📁 {dataset.name}
          </Title>
          <Space>
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

      {/* Dataset Information */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="Dataset Information">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic 
                  title="Total Images" 
                  value={images.length} 
                  prefix="🖼️"
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Annotated Images" 
                  value={annotatedCount} 
                  prefix="🏷️"
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="Progress" 
                  value={progressPercent} 
                  suffix="%" 
                  precision={1}
                />
              </Col>
              <Col span={6}>
                <div>
                  <Text strong>Status</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color={progressPercent === 100 ? 'success' : progressPercent > 0 ? 'processing' : 'warning'}>
                      {progressPercent === 100 ? 'Complete' : progressPercent > 0 ? 'In Progress' : 'Not Started'}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>
            
            <div style={{ marginTop: '16px' }}>
              <Text strong>Progress:</Text>
              <Progress 
                percent={progressPercent} 
                status={progressPercent === 100 ? 'success' : 'active'}
                style={{ marginTop: 8 }}
              />
            </div>

            {dataset.description && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>Description:</Text>
                <div style={{ marginTop: 8 }}>
                  <Text>{dataset.description}</Text>
                </div>
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <Text strong>Dataset ID:</Text>
              <div style={{ marginTop: 8 }}>
                <Text code>{dataset.id}</Text>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <Text strong>Created:</Text>
              <div style={{ marginTop: 8 }}>
                <Text>{new Date(dataset.created_at).toLocaleString()}</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Images Table */}
      <Card title={`Images (${images.length})`}>
        <Table
          columns={imageColumns}
          dataSource={images}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} images`,
          }}
        />
      </Card>

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
    </div>
  );
};

export default DatasetDetail;