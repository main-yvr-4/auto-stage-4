import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
  Tag,
  Descriptions,
  Statistic,
  Row,
  Col,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Progress
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  PictureOutlined,
  TagOutlined,
  CalendarOutlined,
  SettingOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { projectsAPI, datasetsAPI, handleAPIError } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form] = Form.useForm();

  // Load project details
  const loadProject = async () => {
    setLoading(true);
    try {
      const projectData = await projectsAPI.getProject(projectId);
      setProject(projectData);
      form.setFieldsValue({
        name: projectData.name,
        description: projectData.description,
        confidence_threshold: projectData.confidence_threshold,
        iou_threshold: projectData.iou_threshold
      });
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to load project: ${errorInfo.message}`);
      console.error('Load project error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load project datasets
  const loadDatasets = async () => {
    setDatasetsLoading(true);
    try {
      const datasetsData = await datasetsAPI.getDatasets(projectId);
      setDatasets(datasetsData);
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to load datasets: ${errorInfo.message}`);
      console.error('Load datasets error:', error);
    } finally {
      setDatasetsLoading(false);
    }
  };

  // Update project
  const handleUpdateProject = async (values) => {
    setUpdating(true);
    try {
      const updatedProject = await projectsAPI.updateProject(projectId, values);
      setProject(updatedProject);
      setEditModalVisible(false);
      message.success('Project updated successfully');
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to update project: ${errorInfo.message}`);
      console.error('Update project error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    try {
      await projectsAPI.deleteProject(projectId);
      message.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to delete project: ${errorInfo.message}`);
      console.error('Delete project error:', error);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadDatasets();
    }
  }, [projectId]);

  // Dataset table columns
  const datasetColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.id}
          </Text>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description) => (
        <Text type="secondary">
          {description || 'No description'}
        </Text>
      ),
    },
    {
      title: 'Images',
      dataIndex: 'total_images',
      key: 'total_images',
      render: (total, record) => (
        <Space direction="vertical" size="small">
          <Text>{total} total</Text>
          <Text type="secondary">{record.labeled_images} labeled</Text>
        </Space>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = record.total_images > 0 
          ? Math.round((record.labeled_images / record.total_images) * 100) 
          : 0;
        return (
          <div style={{ minWidth: '120px' }}>
            <Progress percent={progress} size="small" />
          </div>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small"
            onClick={() => navigate(`/datasets/${record.id}`)}
          >
            View
          </Button>
          <Button 
            size="small"
            onClick={() => navigate(`/annotate/${record.id}`)}
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
        <div style={{ marginTop: 16 }}>
          <Text>Loading project details...</Text>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <Alert
        message="Project Not Found"
        description="The requested project could not be found."
        type="error"
        showIcon
        action={
          <Button onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        }
      />
    );
  }

  const projectTypeColors = {
    'object_detection': 'blue',
    'classification': 'green',
    'segmentation': 'purple'
  };

  const overallProgress = project.total_images > 0 
    ? Math.round((project.labeled_images / project.total_images) * 100) 
    : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </Button>
        </Space>
      </div>

      {/* Project Info Card */}
      <Card 
        title={
          <Space>
            <TagOutlined />
            <Title level={3} style={{ margin: 0 }}>
              {project.name}
            </Title>
            <Tag color={projectTypeColors[project.project_type] || 'default'}>
              {project.project_type}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<EditOutlined />}
              onClick={() => setEditModalVisible(true)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Are you sure you want to delete this project?"
              description="This action cannot be undone. All associated datasets will also be deleted."
              onConfirm={handleDeleteProject}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button icon={<DeleteOutlined />} danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Description">
                {project.description || 'No description'}
              </Descriptions.Item>
              <Descriptions.Item label="Project ID">
                <Text code>{project.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                <Space>
                  <CalendarOutlined />
                  {new Date(project.created_at).toLocaleString()}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                <Space>
                  <CalendarOutlined />
                  {new Date(project.updated_at).toLocaleString()}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Total Datasets"
                  value={project.total_datasets}
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Total Images"
                  value={project.total_images}
                  prefix={<PictureOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Labeled Images"
                  value={project.labeled_images}
                  prefix={<TagOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Progress"
                  value={overallProgress}
                  suffix="%"
                  prefix={<SettingOutlined />}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text strong>Overall Progress</Text>
              <Progress 
                percent={overallProgress} 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
          </Col>
        </Row>

        {/* Model Configuration */}
        <div style={{ marginTop: 24 }}>
          <Title level={5}>Model Configuration</Title>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Confidence Threshold: </Text>
              <Text>{project.confidence_threshold}</Text>
            </Col>
            <Col span={12}>
              <Text strong>IoU Threshold: </Text>
              <Text>{project.iou_threshold}</Text>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Datasets Card */}
      <Card 
        title={
          <Space>
            <DatabaseOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Datasets ({datasets.length})
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadDatasets}
              loading={datasetsLoading}
            >
              Refresh
            </Button>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`/datasets?project=${projectId}`)}
            >
              Add Dataset
            </Button>
          </Space>
        }
        style={{ marginTop: 24 }}
      >
        <Table
          columns={datasetColumns}
          dataSource={datasets}
          rowKey="id"
          loading={datasetsLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} datasets`,
          }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Project"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProject}
        >
          <Form.Item
            name="name"
            label="Project Name"
            rules={[
              { required: true, message: 'Please enter project name' },
              { min: 2, message: 'Name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Enter project description (optional)"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="confidence_threshold"
                label="Confidence Threshold"
                rules={[
                  { required: true, message: 'Please enter confidence threshold' },
                  { type: 'number', min: 0, max: 1, message: 'Must be between 0 and 1' }
                ]}
              >
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="1"
                  placeholder="0.5"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="iou_threshold"
                label="IoU Threshold"
                rules={[
                  { required: true, message: 'Please enter IoU threshold' },
                  { type: 'number', min: 0, max: 1, message: 'Must be between 0 and 1' }
                ]}
              >
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="1"
                  placeholder="0.45"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={updating}>
                Update Project
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDetail;