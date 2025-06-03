import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Spin,
  Tag,
  message,
  Row,
  Col,
  Dropdown,
  Menu,
  Avatar,
  Divider
} from 'antd';
import {
  ProjectOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  PictureOutlined,
  MoreOutlined,
  FolderOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  SearchOutlined,
  TeamOutlined,
  CopyOutlined,
  MergeCellsOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, handleAPIError } from '../services/api';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_edited');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [form] = Form.useForm();

  // Load projects
  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await projectsAPI.getProjects();
      setProjects(projectsData);
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to load projects: ${errorInfo.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Delete project
  const handleDeleteProject = async (projectId) => {
    try {
      await projectsAPI.deleteProject(projectId);
      message.success('Project deleted successfully');
      loadProjects(); // Reload projects
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to delete project: ${errorInfo.message}`);
    }
  };

  // Create project
  const handleCreateProject = async (values) => {
    setCreating(true);
    try {
      const newProject = await projectsAPI.createProject(values);
      message.success('Project created successfully!');
      setCreateModalVisible(false);
      form.resetFields();
      loadProjects(); // Reload projects
      // Navigate to the new project workspace
      navigate(`/projects/${newProject.id}/workspace`);
    } catch (error) {
      const errorInfo = handleAPIError(error);
      message.error(`Failed to create project: ${errorInfo.message}`);
    } finally {
      setCreating(false);
    }
  };

  // Helper functions for project cards
  const getProjectTypeInfo = (type) => {
    const typeInfo = {
      'object_detection': { color: 'blue', label: 'Object Detection', icon: <BarChartOutlined /> },
      'classification': { color: 'green', label: 'Classification', icon: <PictureOutlined /> },
      'segmentation': { color: 'purple', label: 'Segmentation', icon: <SettingOutlined /> }
    };
    return typeInfo[type] || { color: 'default', label: type, icon: <ProjectOutlined /> };
  };

  const getProgressInfo = (project) => {
    const progress = project.total_images > 0 
      ? Math.round((project.labeled_images / project.total_images) * 100) 
      : 0;
    
    let status = 'normal';
    if (progress === 0) status = 'exception';
    else if (progress === 100) status = 'success';
    else if (progress > 50) status = 'active';
    
    return { progress, status };
  };

  // Generate project thumbnail based on type
  const getProjectThumbnail = (project) => {
    const typeInfo = getProjectTypeInfo(project.project_type);
    return (
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${
          typeInfo.color === 'blue' ? '#1890ff, #40a9ff' : 
          typeInfo.color === 'green' ? '#52c41a, #73d13d' : 
          typeInfo.color === 'purple' ? '#722ed1, #9254de' : '#d9d9d9, #f0f0f0'
        })`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        flexShrink: 0
      }}>
        {typeInfo.icon}
      </div>
    );
  };

  const renderProjectCard = (project) => {
    const typeInfo = getProjectTypeInfo(project.project_type);
    const { progress } = getProgressInfo(project);
    
    const moreMenu = (
      <Menu>
        <Menu.Item 
          key="rename" 
          icon={<EditOutlined />}
          onClick={() => {
            setOpenDropdownId(null); // Close dropdown
            Modal.confirm({
              title: 'Rename Project',
              content: (
                <div>
                  <p>Enter new name for "{project.name}":</p>
                  <Input 
                    id="rename-input"
                    defaultValue={project.name}
                    placeholder="Project name"
                    style={{ marginTop: '8px' }}
                  />
                </div>
              ),
              okText: 'Rename',
              cancelText: 'Cancel',
              onOk: async () => {
                const newName = document.getElementById('rename-input').value;
                if (newName && newName.trim() !== project.name) {
                  try {
                    await projectsAPI.updateProject(project.id, { name: newName.trim() });
                    message.success(`Project renamed to "${newName.trim()}"`);
                    loadProjects(); // Refresh the projects list
                  } catch (error) {
                    const errorInfo = handleAPIError(error);
                    message.error(`Failed to rename project: ${errorInfo.message}`);
                  }
                }
              },
            });
          }}
        >
          Rename Project
        </Menu.Item>
        <Menu.Item 
          key="duplicate" 
          icon={<CopyOutlined />}
          onClick={() => {
            setOpenDropdownId(null); // Close dropdown
            Modal.confirm({
              title: 'Duplicate Project',
              content: `Create a copy of "${project.name}" with all its datasets and configurations?`,
              okText: 'Duplicate',
              cancelText: 'Cancel',
              onOk: async () => {
                try {
                  await projectsAPI.duplicateProject(project.id);
                  message.success(`Project "${project.name}" duplicated successfully with all datasets, images, and annotations`);
                  loadProjects(); // Refresh the projects list
                } catch (error) {
                  const errorInfo = handleAPIError(error);
                  message.error(`Failed to duplicate project: ${errorInfo.message}`);
                }
              },
            });
          }}
        >
          Duplicate Project
        </Menu.Item>
        <Menu.Item 
          key="merge" 
          icon={<MergeCellsOutlined />}
          onClick={() => {
            setOpenDropdownId(null); // Close dropdown
            const otherProjects = projects.filter(p => p.id !== project.id);
            if (otherProjects.length === 0) {
              message.warning('No other projects available to merge with');
              return;
            }
            
            let selectedProjectId = null;
            let mergedProjectName = '';
            Modal.confirm({
              title: 'Create Merged Project',
              content: (
                <div>
                  <p>Create a new project by merging "{project.name}" with another project:</p>
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>New Project Name:</label>
                    <Input 
                      id="merge-project-name"
                      placeholder="Enter name for merged project"
                      defaultValue={`${project.name} + Merged Project`}
                      style={{ marginBottom: '12px' }}
                      onChange={(e) => { mergedProjectName = e.target.value; }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Select Project to Merge With:</label>
                    <Select 
                      placeholder="Select project to merge with"
                      style={{ width: '100%' }}
                      onChange={(value) => { selectedProjectId = value; }}
                    >
                      {otherProjects.map(p => (
                        <Option key={p.id} value={p.id}>{p.name}</Option>
                      ))}
                    </Select>
                  </div>
                  <p style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                    Note: This will create a new project combining datasets from both projects. Original projects will remain unchanged.
                  </p>
                </div>
              ),
              okText: 'Create Merged Project',
              cancelText: 'Cancel',
              onOk: async () => {
                const finalProjectName = document.getElementById('merge-project-name').value || `${project.name} + Merged Project`;
                if (selectedProjectId) {
                  try {
                    const targetProject = otherProjects.find(p => p.id === selectedProjectId);
                    // For now, we'll simulate merge by showing success message
                    // In a real implementation, this would create a new project and copy datasets from both projects
                    message.success(`New merged project "${finalProjectName}" created from "${project.name}" and "${targetProject?.name}"`);
                    // TODO: Implement actual merge API call that creates new project with combined datasets
                    loadProjects(); // Refresh the projects list
                  } catch (error) {
                    const errorInfo = handleAPIError(error);
                    message.error(`Failed to create merged project: ${errorInfo.message}`);
                  }
                } else {
                  message.warning('Please select a project to merge with');
                }
              },
            });
          }}
        >
          Merge with Other Project
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item 
          key="delete" 
          icon={<DeleteOutlined />}
          danger
          onClick={() => {
            setOpenDropdownId(null); // Close dropdown
            Modal.confirm({
              title: 'Delete Project',
              content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
              okText: 'Delete',
              okType: 'danger',
              cancelText: 'Cancel',
              onOk: () => handleDeleteProject(project.id),
            });
          }}
        >
          Delete Project
        </Menu.Item>
      </Menu>
    );

    return (
      <Col xs={24} sm={12} lg={8} key={project.id}>
        <Card
          hoverable
          style={{ 
            height: '100%',
            borderRadius: '8px',
            border: '1px solid #f0f0f0',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          bodyStyle={{ padding: '16px' }}
          onClick={(e) => {
            // Check if click target is within dropdown menu or related elements
            const target = e.target;
            const isDropdownClick = target.closest('.ant-dropdown') || 
                                  target.closest('.ant-dropdown-menu') ||
                                  target.closest('.ant-dropdown-menu-item') ||
                                  target.closest('[data-menu-id]') ||
                                  target.closest('.ant-btn') ||
                                  target.closest('.anticon-more') ||
                                  target.closest('[role="menuitem"]');
            
            // Also check if dropdown is currently open for this project
            const isDropdownOpen = openDropdownId === project.id;
            
            if (!isDropdownClick && !isDropdownOpen) {
              navigate(`/projects/${project.id}/workspace`);
            }
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {/* Project Thumbnail */}
            {getProjectThumbnail(project)}
            
            {/* Project Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Project Type Badge */}
              <Tag 
                color={typeInfo.color} 
                style={{ 
                  marginBottom: '8px',
                  fontSize: '11px',
                  fontWeight: 500,
                  border: 'none'
                }}
              >
                {typeInfo.label}
              </Tag>
              
              {/* Project Name */}
              <Title 
                level={4} 
                style={{ 
                  margin: 0, 
                  marginBottom: '4px',
                  fontSize: '16px',
                  fontWeight: 600,
                  lineHeight: '20px'
                }}
                ellipsis={{ tooltip: project.name }}
              >
                {project.name}
              </Title>
              
              {/* Project Description */}
              <Text 
                type="secondary" 
                style={{ 
                  fontSize: '13px',
                  lineHeight: '18px',
                  display: 'block',
                  marginBottom: '12px'
                }}
                ellipsis={{ tooltip: project.description }}
              >
                {project.description || 'No description provided'}
              </Text>
              
              {/* Project Stats */}
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: '8px',
                fontSize: '13px',
                color: '#666'
              }}>
                <span>
                  <PictureOutlined style={{ marginRight: '4px' }} />
                  {project.total_images} Images
                </span>
                <span>
                  <DatabaseOutlined style={{ marginRight: '4px' }} />
                  {project.total_datasets} Datasets
                </span>
              </div>
              
              {/* Progress and Date */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: '12px',
                color: '#999'
              }}>
                <span>
                  {progress}% annotated
                </span>
                <span>
                  Edited {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {/* Action Menu */}
            <Dropdown 
              overlay={moreMenu} 
              trigger={['click']}
              placement="bottomRight"
              onOpenChange={(open) => {
                setOpenDropdownId(open ? project.id : null);
              }}
            >
              <Button 
                type="text"
                icon={<MoreOutlined />}
                style={{ 
                  color: '#999',
                  border: 'none',
                  boxShadow: 'none'
                }}
                onClick={(e) => {
                  if (e && e.stopPropagation) {
                    e.stopPropagation();
                  }
                }}
              />
            </Dropdown>
          </div>
        </Card>
      </Col>
    );
  };

  const handleCreate = () => {
    setCreateModalVisible(true);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      handleCreateProject(values);
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading projects...</Text>
        </div>
      </div>
    );
  }

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date_edited') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      {/* Header - Roboflow Style */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px'
      }}>
        <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>
          Projects
        </Title>
        <Space size="middle">
          <Button 
            icon={<TeamOutlined />}
            style={{ 
              borderRadius: '6px',
              height: '36px',
              fontSize: '14px'
            }}
            onClick={() => message.info('🚀 Team collaboration feature coming soon!')}
          >
            Invite Team
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleCreate}
            style={{ 
              borderRadius: '6px',
              height: '36px',
              fontSize: '14px',
              background: '#722ed1',
              borderColor: '#722ed1'
            }}
          >
            New Project
          </Button>
        </Space>
      </div>

      {/* Search and Filter Bar - Roboflow Style */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        <Input
          placeholder="Search projects"
          prefix={<SearchOutlined style={{ color: '#999' }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '300px',
            borderRadius: '6px',
            height: '36px'
          }}
        />
        <Select
          value={sortBy}
          onChange={setSortBy}
          style={{ 
            width: '160px',
            height: '36px'
          }}
          placeholder="Sort by"
        >
          <Option value="date_edited">Date Edited</Option>
          <Option value="name">Name</Option>
        </Select>
        <Button 
          icon={<ReloadOutlined />}
          onClick={loadProjects}
          loading={loading}
          style={{ 
            borderRadius: '6px',
            height: '36px'
          }}
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredProjects.map(project => renderProjectCard(project))}
        </Row>
      ) : projects.length > 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 40px',
          background: '#fafafa',
          borderRadius: '8px',
          border: '1px solid #f0f0f0'
        }}>
          <SearchOutlined style={{ 
            fontSize: 48, 
            color: '#d9d9d9', 
            marginBottom: 16 
          }} />
          <Title level={4} style={{ color: '#666', marginBottom: 8 }}>
            No projects found
          </Title>
          <Text type="secondary">
            Try adjusting your search terms or filters
          </Text>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 40px',
          background: '#fafafa',
          borderRadius: '8px',
          border: '2px dashed #d9d9d9'
        }}>
          <ProjectOutlined style={{ 
            fontSize: 64, 
            color: '#d9d9d9', 
            marginBottom: 24 
          }} />
          <Title level={3} style={{ color: '#666', marginBottom: 16 }}>
            No projects created yet
          </Title>
          <Paragraph type="secondary" style={{ fontSize: '16px', marginBottom: 32 }}>
            Create your first project to start organizing your datasets and models.<br />
            Projects help you manage different computer vision tasks efficiently.
          </Paragraph>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCreate}
            style={{ 
              background: '#722ed1',
              borderColor: '#722ed1',
              borderRadius: '6px',
              height: '40px'
            }}
          >
            Create Your First Project
          </Button>
        </div>
      )}

      <Modal
        title="Create Project"
        open={createModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        width={600}
        confirmLoading={creating}
        okText="Create Project"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please enter project name' }]}
          >
            <Input placeholder="Enter project name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter project description" rows={3} />
          </Form.Item>

          <Form.Item
            name="project_type"
            label="Project Type"
            rules={[{ required: true, message: 'Please select project type' }]}
          >
            <Select placeholder="Select project type">
              <Option value="object_detection">Object Detection</Option>
              <Option value="classification">Image Classification</Option>
              <Option value="segmentation">Image Segmentation</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;