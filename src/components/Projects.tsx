import React, { useState } from 'react';

interface Project {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  budget: string;
  manager: string;
}

interface NewProject {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  budget: string;
  manager: string;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: '아파트 건설 프로젝트 A동',
      location: '서울시 강남구',
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      status: '진행중',
      progress: 65,
      budget: '50억원',
      manager: '김현수'
    },
    {
      id: 2,
      name: '상업시설 리모델링',
      location: '서울시 송파구',
      startDate: '2024-03-01',
      endDate: '2024-08-30',
      status: '진행중',
      progress: 40,
      budget: '15억원',
      manager: '이지훈'
    },
    {
      id: 3,
      name: '도로 포장 공사',
      location: '경기도 성남시',
      startDate: '2024-02-01',
      endDate: '2024-05-31',
      status: '완료',
      progress: 100,
      budget: '8억원',
      manager: '박민정'
    }
  ]);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [newProject, setNewProject] = useState<NewProject>({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    budget: '',
    manager: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const project: Project = {
      ...newProject,
      id: projects.length + 1,
      status: '계획',
      progress: 0
    };
    setProjects(prev => [...prev, project]);
    setNewProject({
      name: '',
      location: '',
      startDate: '',
      endDate: '',
      budget: '',
      manager: ''
    });
    setShowModal(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">프로젝트 관리</h1>
          <p className="text-gray-600">건설 프로젝트를 관리하고 진행상황을 추적하세요</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          + 새 프로젝트
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                프로젝트명
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                위치
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기간
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                진행률
              </th>
              <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                예산
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                담당자
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{project.name}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{project.location}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {project.startDate} ~ {project.endDate}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    project.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                    project.status === '완료' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{project.progress}%</span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">{project.budget}</div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{project.manager}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 새 프로젝트 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">새 프로젝트 추가</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">프로젝트명</label>
                  <input
                    id="project-name"
                    type="text"
                    name="name"
                    value={newProject.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="project-location" className="block text-sm font-medium text-gray-700">위치</label>
                  <input
                    id="project-location"
                    type="text"
                    name="location"
                    value={newProject.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="project-start-date" className="block text-sm font-medium text-gray-700">시작일</label>
                  <input
                    id="project-start-date"
                    type="date"
                    name="startDate"
                    value={newProject.startDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="project-end-date" className="block text-sm font-medium text-gray-700">종료일</label>
                  <input
                    id="project-end-date"
                    type="date"
                    name="endDate"
                    value={newProject.endDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="project-budget" className="block text-sm font-medium text-gray-700">예산</label>
                  <input
                    id="project-budget"
                    type="text"
                    name="budget"
                    value={newProject.budget}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="project-manager" className="block text-sm font-medium text-gray-700">담당자</label>
                  <input
                    id="project-manager"
                    type="text"
                    name="manager"
                    value={newProject.manager}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    추가
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;