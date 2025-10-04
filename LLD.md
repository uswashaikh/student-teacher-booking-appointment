# Low-Level Design (LLD) Document
## Talent AI - MCQ Test Module

## 1. Project Overview

### 1.1 What is Talent AI?
A web-based recruitment platform that helps companies test candidates using Multiple Choice Questions (MCQ). Built with Django framework.

### 1.2 Technology Stack
- **Backend:** Django 4.2+ (Python 3.11+)
- **Database:** PostgreSQL
- **Frontend:** Bootstrap 5 + HTMX
- **Package Manager:** Poetry

---

## 2. System Components

### 2.1 Module Structure
```
mcq_test/
├── models/              # Database tables
│   ├── question.py      # Question data
│   ├── test_config.py   # Test settings
│   └── test_attempt.py  # User answers
├── views/               # User interface logic
│   ├── test_management.py
│   └── test_taking.py
├── forms/               # Input forms
├── templates/           # HTML pages
└── tests/              # Test cases
```

---

## 3. Database Design

### 3.1 Main Tables

#### Question Table
Stores all MCQ questions.

| Field | Type | Description |
|-------|------|-------------|
| question_id | Integer | Unique number for question |
| question_text | Text | The actual question |
| question_type | String | single_select or multi_select |
| testable_skill | Foreign Key | Links to skill (Python, JavaScript, etc) |
| max_points | Integer | Maximum score for this question |
| options | JSON | Answer choices with weights |
| difficulty | String | beginner/intermediate/advanced |
| is_active | Boolean | Can this question be used? |

**Example Question Data:**
```json
{
  "question_id": 3001,
  "question_text": "What is Python used for?",
  "question_type": "single_select",
  "testable_skill": "Python",
  "max_points": 10,
  "options": [
    {"id": "A", "text": "Web only", "weight": 1, "is_correct": false},
    {"id": "B", "text": "Data only", "weight": 1, "is_correct": false},
    {"id": "C", "text": "Both", "weight": 3, "is_correct": true}
  ],
  "difficulty": "beginner"
}
```

#### TestConfiguration Table
Defines how a test works.

| Field | Type | Description |
|-------|------|-------------|
| title | String | Test name |
| description | Text | What the test is about |
| test_type | String | bidirectional (can go back) or unidirectional |
| time_limit_minutes | Integer | How long the test lasts |
| questions | JSON Array | List of question IDs [3001, 3002, 3003] |
| randomize_questions | Boolean | Shuffle question order? |
| navigation_rules | JSON | Settings like "allow_previous": true |
| security_settings | JSON | Settings like "prevent_copy_paste": true |
| is_active | Boolean | Is test ready to use? |

#### TestAttempt Table
Tracks each candidate taking a test.

| Field | Type | Description |
|-------|------|-------------|
| test | Foreign Key | Which test configuration |
| candidate_name | String | Person's name |
| candidate_email | String | Person's email |
| status | String | initiated/in_progress/submitted/cancelled |
| answers | JSON | All selected answers |
| performance_data | JSON | Final score and breakdown |
| created_at | DateTime | When test started |

### 3.2 Database Relationships
```
TestableSkills (Python, Django, JavaScript)
        │
        │ One skill has many questions
        ▼
Question (3001, 3002, 3003, etc.)
        │
        │ Questions are used in many tests
        ▼
TestConfiguration (Python Skills Test)
        │
        │ One test has many attempts
        ▼
TestAttempt (candidate session data)
```

---

## 4. Key Classes and Functions

### 4.1 Question Model
```python
class Question(models.Model):
    """Stores a single MCQ question."""
    
    question_id = models.IntegerField(unique=True)
    question_text = models.TextField()
    question_type = models.CharField(max_length=20)
    testable_skill = models.ForeignKey('TestableSkills')
    max_points = models.IntegerField()
    options = models.JSONField()
    difficulty = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    
    def get_correct_options(self):
        """Returns list of correct answer IDs."""
        return [opt['id'] for opt in self.options if opt['is_correct']]
```

### 4.2 TestConfiguration Model
```python
class TestConfiguration(models.Model):
    """Defines a test with its rules."""
    
    title = models.CharField(max_length=200)
    test_type = models.CharField(max_length=20)
    time_limit_minutes = models.IntegerField()
    questions = models.JSONField(default=list)  # [3001, 3002, 3003]
    randomize_questions = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    
    def get_total_points(self):
        """Calculate maximum possible score."""
        question_objects = Question.objects.filter(
            question_id__in=self.questions
        )
        return sum(q.max_points for q in question_objects)
```

### 4.3 ScoringEngine Service
```python
class ScoringEngine:
    """Calculates test scores."""
    
    @staticmethod
    def calculate_question_score(question, selected_options):
        """
        Score one question.
        
        Args:
            question: Question object
            selected_options: List like ['A', 'C']
            
        Returns:
            Dictionary with points earned and max points
        """
        points_earned = 0
        
        if question.question_type == 'single_select':
            # Find selected option
            for option in question.options:
                if option['id'] in selected_options and option['is_correct']:
                    points_earned = option['weight']
        
        elif question.question_type == 'multi_select':
            # Add points for correct, subtract for incorrect
            for option in question.options:
                if option['id'] in selected_options:
                    if option['is_correct']:
                        points_earned += option['weight']
                    else:
                        points_earned -= option['weight']
        
        return {
            'points_earned': max(0, points_earned),
            'max_points': question.max_points,
            'percentage': (points_earned / question.max_points) * 100
        }
```

---

## 5. Important Views (Page Logic)

### 5.1 Test List View
Shows all tests to admin/recruiter.

**URL:** `/mcq/tests/`

**What it does:**
1. Get all test configurations from database
2. Allow search by title
3. Filter by status (active/inactive)
4. Show statistics (total tests, active tests)

**Template:** `test_list.html`

### 5.2 Test Create View
Creates a new test.

**URL:** `/mcq/tests/create/`

**What it does:**
1. Show form with title and description
2. Validate input
3. Save to database (starts as draft, is_active=False)
4. Redirect to add questions page

### 5.3 Question Management View
Add/remove questions from a test.

**URL:** `/mcq/tests/{test_id}/questions/`

**What it does:**
1. Show current questions in test
2. Show available questions (with search and filters)
3. Add question: POST request updates test.questions array
4. Remove question: POST request removes from array
5. Preserve filters after add/remove actions

### 5.4 Test Taking View
Candidate takes the test.

**URL:** `/mcq/attempt/{attempt_id}/question/{number}/`

**What it does:**
1. Load question from test configuration
2. Show question with options
3. Track time spent
4. Save answer via AJAX
5. Navigate to next/previous (based on test_type)
6. Auto-submit when time expires

---

## 6. Request Flow Examples

### 6.1 Creating a Test
```
User (Admin)
    │
    │ 1. Clicks "Create Test"
    ▼
Browser → GET /mcq/tests/create/
    │
    │ 2. Server shows form
    ▼
Browser displays form
    │
    │ 3. User fills form and submits
    ▼
Browser → POST /mcq/tests/create/
          (title="Python Test", description="...")
    │
    │ 4. Django validates and saves
    ▼
TestConfiguration.objects.create(...)
    │
    │ 5. Redirect to add questions
    ▼
Browser → Redirects to /mcq/tests/123/questions/
```

### 6.2 Taking a Test
```
Candidate
    │
    │ 1. Visits test URL
    ▼
Browser → GET /mcq/test/123/start/
    │
    │ 2. Enter name and email
    ▼
Browser → POST /mcq/test/123/start/
    │
    │ 3. Create attempt record
    ▼
TestAttempt.objects.create(status='in_progress')
    │
    │ 4. Show first question
    ▼
Browser → GET /mcq/attempt/456/question/1/
    │
    │ 5. Candidate selects answer
    ▼
Browser → POST /mcq/attempt/456/answer/
          (question_id=3001, selected=['C'])
    │
    │ 6. Save answer, show next question
    ▼
Update attempt.answers JSON
    │
    │ 7. Last question answered
    ▼
Browser → POST /mcq/attempt/456/submit/
    │
    │ 8. Calculate final score
    ▼
ScoringEngine.calculate_test_score()
    │
    │ 9. Show results
    ▼
Browser → Redirects to /mcq/attempt/456/results/
```

---

## 7. Security Features

### 7.1 Test Security
```javascript
// Prevent copy-paste (if enabled in settings)
if (testConfig.prevent_copy_paste) {
    document.addEventListener('copy', (e) => {
        e.preventDefault();
        alert('Copy is disabled during test');
    });
}

// Track focus loss (if enabled)
if (testConfig.track_focus_changes) {
    window.addEventListener('blur', () => {
        focusLossCount++;
        // Send to server
        fetch('/mcq/security-event/', {
            method: 'POST',
            body: JSON.stringify({event: 'focus_loss'})
        });
    });
}
```

### 7.2 Session Validation
```python
def validate_test_session(request, attempt_id):
    """Make sure test session is valid."""
    attempt = TestAttempt.objects.get(pk=attempt_id)
    
    # Check if test is still in progress
    if attempt.status != 'in_progress':
        raise PermissionDenied("Test already completed")
    
    # Check if time expired
    if is_time_expired(attempt):
        auto_submit_test(attempt)
        raise PermissionDenied("Time limit exceeded")
    
    return attempt
```

---

## 8. Database Queries (Examples)

### 8.1 Get All Active Questions for a Skill
```python
python_questions = Question.objects.filter(
    testable_skill__skill_name='Python',
    is_active=True
).order_by('difficulty')
```

### 8.2 Get Test with Question Details
```python
test = TestConfiguration.objects.get(pk=test_id)

# Get all questions used in this test
questions = Question.objects.filter(
    question_id__in=test.questions
).select_related('testable_skill')  # Avoid N+1 queries
```

### 8.3 Calculate Average Score
```python
avg_score = TestAttempt.objects.filter(
    test_id=test_id,
    status='submitted'
).aggregate(
    avg_score=Avg('performance_data__final_score')
)
```

---

## 9. Forms

### 9.1 TestConfigurationForm
```python
class TestConfigurationForm(forms.ModelForm):
    """Form to create/edit test configuration."""
    
    class Meta:
        model = TestConfiguration
        fields = ['title', 'description']
    
    def clean_title(self):
        """Validate title is not empty."""
        title = self.cleaned_data['title']
        if len(title) < 5:
            raise ValidationError("Title too short")
        return title
```

### 9.2 TestSettingsForm
```python
class TestSettingsForm(forms.Form):
    """Form for test behavior settings."""
    
    test_type = forms.ChoiceField(
        choices=[
            ('bidirectional', 'Allow going back'),
            ('unidirectional', 'One-way only')
        ]
    )
    time_limit_minutes = forms.IntegerField(min_value=5)
    randomize_questions = forms.BooleanField(required=False)
    prevent_copy_paste = forms.BooleanField(required=False)
```

---

## 10. URLs Configuration

```python
# mcq_test/urls.py

urlpatterns = [
    # Management URLs (for admin/recruiter)
    path('tests/', TestListView.as_view(), name='test_list'),
    path('tests/create/', TestCreateView.as_view(), name='test_create'),
    path('tests/<int:test_id>/', TestDetailView.as_view(), name='test_detail'),
    path('tests/<int:test_id>/questions/', 
         TestQuestionsManageView.as_view(), 
         name='test_questions_manage'),
    path('tests/<int:test_id>/settings/', 
         TestSettingsView.as_view(), 
         name='test_settings'),
    
    # Test-taking URLs (for candidates)
    path('test/<int:test_id>/start/', 
         TestStartView.as_view(), 
         name='test_start'),
    path('attempt/<int:attempt_id>/question/<int:question_number>/', 
         QuestionView.as_view(), 
         name='question_view'),
    path('attempt/<int:attempt_id>/submit/', 
         TestSubmitView.as_view(), 
         name='test_submit'),
]
```

---

## 11. Testing

### 11.1 Test Structure
```
tests/
├── test_models.py           # Test database models
├── test_views.py            # Test page logic
├── test_forms.py            # Test form validation
└── test_services.py         # Test scoring logic
```

### 11.2 Example Test Case
```python
def test_test_list_search_functionality(self):
    """Test that search finds tests by title."""
    
    # Create test data
    TestConfiguration.objects.create(
        title="Python Skills Test",
        description="Test for Python developers"
    )
    
    # Search for "Python"
    response = self.client.get('/mcq/tests/', {'search': 'Python'})
    
    # Check results
    self.assertEqual(response.status_code, 200)
    tests = response.context['tests']
    self.assertEqual(len(tests), 1)
    self.assertEqual(tests[0].title, "Python Skills Test")
```

---

## 12. Common Patterns Used

### 12.1 JSON Fields for Flexibility
Instead of creating many tables, we use JSON for flexible data:
```python
# Store answer options as JSON
options = [
    {"id": "A", "text": "Option 1", "weight": 1, "is_correct": false},
    {"id": "B", "text": "Option 2", "weight": 3, "is_correct": true}
]

# Store user answers as JSON
answers = {
    "3001": {"selected": ["C"], "time_spent": 45},
    "3002": {"selected": ["A", "B"], "time_spent": 62}
}
```

### 12.2 Status Field Pattern
Track object lifecycle with status:
```python
class TestAttempt:
    STATUS_CHOICES = [
        ('initiated', 'Just started'),
        ('in_progress', 'Actively taking test'),
        ('submitted', 'Completed'),
        ('cancelled', 'Abandoned')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
```

### 12.3 Soft Delete Pattern
Don't actually delete, just mark inactive:
```python
# Instead of: question.delete()
# Do this:
question.is_active = False
question.save()

# Only show active items
Question.objects.filter(is_active=True)
```

---

## 13. Important Notes

### 13.1 Performance Tips
- Use `select_related()` for foreign keys
- Use `prefetch_related()` for many-to-many
- Add database indexes on frequently searched fields
- Cache test configurations (they don't change often)

### 13.2 Security Checklist
- ✅ CSRF protection on all forms
- ✅ Validate all user input
- ✅ Use Django's built-in authentication
- ✅ SQL injection prevented by ORM
- ✅ XSS prevented by template escaping

---

## 14. Future Improvements
- Add question categories/tags
- Support essay-type questions
- Add test scheduling (start/end dates)
- Generate PDF reports
- Email notifications for test completion

---

**Document Status:** Complete  
**Last Updated:** October 2025  
**Author:** Internship Team