import os

controller_path = os.path.join(os.path.dirname(__file__), '..', 'server', 'controllers', 'campusController.js')
with open(controller_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace roadmaps select in getCohortStudents
code = code.replace(
'''          select: {
            id: true,
            careerPathTitle: true,
            progressPercentage: true,
            status: true,
            updatedAt: true
          }''',
'''          select: {
            id: true,
            progressPercentage: true,
            status: true,
            updatedAt: true,
            careerSnapshot: true,
            career: { select: { title: true } }
          }'''
)

# Replace roadmaps select in exportCohortCsv
code = code.replace(
'''          select: { careerPathTitle: true, progressPercentage: true, status: true }''',
'''          select: { progressPercentage: true, status: true, careerSnapshot: true, career: { select: { title: true } } }'''
)

# Replace track extraction
code = code.replace(
    "track: activeRoadmap?.careerPathTitle || 'Full-Stack Web & AI',",
    "track: activeRoadmap?.career?.title || activeRoadmap?.careerSnapshot?.title || 'Full-Stack Web & AI',"
)

code = code.replace(
    "const track = (rm?.careerPathTitle || 'Exploring').replace(/,/g, ' ');",
    "const track = (rm?.career?.title || rm?.careerSnapshot?.title || 'Full-Stack Web & AI').replace(/,/g, ' ');"
)

with open(controller_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Fixed Roadmap relation fields in campusController.js")
