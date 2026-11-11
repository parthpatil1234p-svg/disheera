import os

controller_path = os.path.join(os.path.dirname(__file__), '..', 'server', 'controllers', 'campusController.js')
with open(controller_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace select in getCohortStudents
code = code.replace(
'''        phone: true,
        college: true,
        createdAt: true,''',
'''        phone: true,
        education: true,
        createdAt: true,'''
)

# Replace select in exportCohortCsv
code = code.replace(
'''        phone: true,
        college: true,
        roadmaps: {''',
'''        phone: true,
        education: true,
        roadmaps: {'''
)

# Replace where clause with college
code = code.replace(
'''    const users = await prisma.user.findMany({
      where: {
        role: 'student',
        ...(college ? { college: { contains: college, mode: 'insensitive' } } : {})
      },''',
'''    const users = await prisma.user.findMany({
      where: { role: 'student' },'''
)

# Replace u.college
code = code.replace(
    "college: u.college || 'G.H. Raisoni College of Engineering and Management (GHRCEM)',",
    "college: u.education?.college || u.education?.institution || 'G.H. Raisoni College of Engineering and Management (GHRCEM)',"
)

code = code.replace(
    "const college = (u.college || 'GHRCEM Jalgaon').replace(/,/g, ' ');",
    "const college = (u.education?.college || u.education?.institution || 'GHRCEM Jalgaon').replace(/,/g, ' ');"
)

with open(controller_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Fixed education field in campusController.js")
