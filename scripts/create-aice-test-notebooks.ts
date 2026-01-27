import { prisma } from "../src/lib/prisma";
import crypto from "crypto";

// AICE AS Level Business and Entrepreneurship Units
const AICE_UNITS = [
  {
    unit: 1,
    title: "Business and its Environment",
    topics: [
      "Enterprise and Entrepreneurship",
      "Business Structure and Organization",
      "Size of Business",
      "Business Objectives",
      "Stakeholders in Business",
      "External Environment",
      "Legal Considerations",
      "Social Enterprise",
    ]
  },
  {
    unit: 2,
    title: "People in Business",
    topics: [
      "Human Resource Management",
      "Motivation and Leadership",
      "Organizational Structure",
      "Recruitment and Selection",
      "Training and Development",
      "Workforce Planning",
      "Communication in Business",
      "Employee Relations",
    ]
  },
  {
    unit: 3,
    title: "Marketing",
    topics: [
      "Marketing Principles",
      "Market Research",
      "Marketing Mix: Product",
      "Marketing Mix: Price",
      "Marketing Mix: Place",
      "Marketing Mix: Promotion",
      "Market Segmentation",
      "Digital Marketing",
    ]
  },
  {
    unit: 4,
    title: "Operations and Project Management",
    topics: [
      "Production Methods",
      "Quality Management",
      "Supply Chain Management",
      "Inventory Management",
      "Location Decisions",
      "Project Planning",
      "Lean Production",
      "Operations Technology",
    ]
  }
];

// Source types to use (8 different types per notebook)
const SOURCE_TYPES = [
  "URL",
  "TEXT",
  "YOUTUBE",
  "TEXT",
  "URL",
  "TEXT",
  "YOUTUBE",
  "TEXT"
] as const;

// Content generation function
function generateTextContent(unitNum: number, topicIdx: number, topicName: string): string {
  const contentMap: Record<string, string> = {
    "1-0": `Enterprise and Entrepreneurship

An entrepreneur is someone who takes the initiative to start a business and accepts the risks involved. Entrepreneurs are essential to economic growth as they create new products, services, and employment opportunities.

Key characteristics of entrepreneurs:
• Risk-taking - willing to invest time and money with uncertain outcomes
• Innovation - developing new ideas or improving existing products/services
• Leadership - ability to motivate and guide others
• Decision-making - making choices under pressure
• Resilience - bouncing back from setbacks

Enterprise refers to the ability to spot opportunities and take advantage of them. It involves creativity, problem-solving, and the willingness to take calculated risks.

Types of business start-ups:
1. Franchise - buying the right to trade under an established brand
2. Start-up from scratch - developing a completely new business idea
3. Social enterprise - business with social objectives alongside profit
4. Management buyout - managers purchasing an existing business

The entrepreneurial process involves:
- Identifying market opportunities
- Developing a business plan
- Securing funding and resources
- Building a team
- Launching and growing the business`,

    "1-1": `Business Structure and Organization

The legal structure of a business determines ownership, control, liability, and how profits are distributed.

Sole Trader:
• One person owns and runs the business
• Unlimited liability - personal assets at risk
• All profits kept by owner
• Simple to set up with minimal legal requirements
• Limited access to capital

Partnership:
• 2-20 partners (typically)
• Partners share responsibilities and profits
• Partnership agreement outlines terms
• Generally unlimited liability (except LLP)
• More capital available than sole trader

Private Limited Company (Ltd):
• Separate legal entity from owners
• Limited liability for shareholders
• Cannot sell shares to public
• More complex regulations
• Share capital provides funding

Public Limited Company (PLC):
• Shares traded on stock exchange
• Minimum share capital requirements
• Full public disclosure of accounts
• Subject to takeovers
• Access to large amounts of capital

Choosing the right structure depends on:
- Size and nature of business
- Risk tolerance
- Funding requirements
- Growth ambitions`,

    "1-2": `Size of Business

Business size can be measured in several ways:
• Number of employees
• Market share
• Revenue/turnover
• Capital employed
• Profit

Small and Medium Enterprises (SMEs):
- Micro: 0-9 employees
- Small: 10-49 employees
- Medium: 50-249 employees

Advantages of small businesses:
• Personal service and customer relationships
• Flexibility and quick decision-making
• Lower overheads
• Niche market specialization

Advantages of large businesses:
• Economies of scale
• Greater brand recognition
• More resources for R&D
• Ability to spread risk

Diseconomies of scale occur when a business becomes too large:
• Communication problems
• Coordination difficulties
• Decreased worker motivation
• Bureaucracy and slow decisions

Growth strategies:
- Internal/organic growth
- External growth through mergers and acquisitions
- Franchising`,

    "1-3": `Business Objectives

Objectives give businesses direction and purpose. They should be SMART:
• Specific - clear and defined
• Measurable - quantifiable progress
• Achievable - realistic given resources
• Relevant - aligned with overall mission
• Time-bound - deadline for completion

Common business objectives:
1. Profit maximization - highest possible profit
2. Survival - staying in business, especially when starting
3. Growth - increasing size, market share, or revenue
4. Market share - portion of total market sales
5. Social/ethical objectives - environmental responsibility, fair trade

Corporate Social Responsibility (CSR):
Businesses increasingly consider their impact on:
• Environment - reducing carbon footprint
• Community - supporting local initiatives
• Employees - fair wages and conditions
• Ethical sourcing - supply chain transparency

Hierarchy of objectives flows from:
Mission → Corporate objectives → Departmental objectives → Individual targets

Stakeholder objectives may conflict with shareholder objectives.`,

    "1-4": `Stakeholders in Business

Stakeholders are individuals or groups with an interest in the business activities and decisions.

Internal stakeholders:
• Employees - concerned with job security, wages, working conditions
• Managers - focused on performance, career progression, bonuses
• Shareholders/owners - interested in profit, dividends, share value

External stakeholders:
• Customers - want quality products, fair prices, good service
• Suppliers - seek regular orders, prompt payment, long-term contracts
• Government - collects taxes, enforces regulations
• Local community - affected by employment, pollution, traffic
• Competitors - monitor market activities and pricing

Stakeholder conflict:
Different stakeholders often have conflicting interests:
• Shareholders want higher profits vs employees wanting higher wages
• Expansion may benefit shareholders but impact local environment
• Lower prices for customers vs higher returns for shareholders

Stakeholder mapping helps prioritize which stakeholders to focus on based on their power and interest level.

Managing stakeholder relationships is crucial for long-term success.`,

    "1-5": `External Environment

PESTLE Analysis examines external factors affecting business:

Political:
• Government policies and stability
• Tax rates and trade agreements
• Employment legislation
• International trade relations

Economic:
• Economic growth/recession
• Interest rates and inflation
• Exchange rates
• Unemployment levels

Social:
• Population demographics
• Lifestyle changes
• Consumer attitudes and trends
• Education levels

Technological:
• New production methods
• Digital transformation
• Automation and AI
• Research and development

Legal:
• Health and safety regulations
• Consumer protection laws
• Employment law
• Competition law

Environmental:
• Climate change concerns
• Sustainability requirements
• Waste management regulations
• Carbon footprint reduction

Porter's Five Forces analyzes competitive environment:
1. Threat of new entrants
2. Bargaining power of suppliers
3. Bargaining power of buyers
4. Threat of substitute products
5. Rivalry among existing competitors`,

    "1-6": `Legal Considerations

Businesses must comply with various laws and regulations:

Consumer Protection:
• Consumer Rights Act - goods must be satisfactory quality, fit for purpose
• Advertising Standards - truthful and not misleading
• Product liability - responsibility for defective products
• Distance selling regulations for online sales

Employment Law:
• Minimum wage requirements
• Working time regulations
• Discrimination legislation (equality)
• Health and safety at work
• Employment contracts and dismissal procedures

Data Protection:
• General Data Protection Regulation (GDPR)
• Processing personal data lawfully
• Right to access and delete data
• Security of customer information

Intellectual Property:
• Patents - protect inventions (20 years)
• Trademarks - protect brand names and logos
• Copyright - protect creative works
• Trade secrets - confidential business information

Competition Law:
• Prevents anti-competitive practices
• Merger and acquisition regulations
• Price fixing prohibition
• Fair trading requirements`,

    "1-7": `Social Enterprise

A social enterprise is a business that prioritizes social objectives alongside (or instead of) profit maximization.

Characteristics of social enterprises:
• Primary purpose is social or environmental
• Majority of profits reinvested in mission
• Accountable to stakeholders
• Often address market failures

Types of social enterprises:
• Community Interest Companies (CIC)
• Cooperatives and mutual societies
• Charitable trading arms
• Social firms and employment organizations

Triple Bottom Line:
Social enterprises measure success using three Ps:
1. People - social impact on communities
2. Planet - environmental sustainability
3. Profit - financial viability

Examples of social objectives:
• Employment for disadvantaged groups
• Environmental conservation
• Affordable housing
• Community development
• Fair trade practices

Challenges for social enterprises:
• Balancing social mission with financial sustainability
• Access to funding and investment
• Measuring social impact
• Competition with traditional businesses`,

    "2-0": `Human Resource Management (HRM)

HRM is the strategic approach to managing people in an organization to maximize employee performance and achieve business objectives.

Functions of HRM:
• Workforce planning - determining future staffing needs
• Recruitment and selection
• Training and development
• Performance management
• Compensation and benefits
• Employee relations

Hard vs Soft HRM:
Hard HRM treats employees as resources to be managed like any other:
• Focus on cost control
• Emphasis on metrics and targets
• Short-term workforce planning
• Minimal employee involvement

Soft HRM views employees as valuable assets:
• Focus on employee development
• Emphasis on commitment and motivation
• Long-term career development
• Employee participation in decisions

HR Planning Process:
1. Analyze business objectives
2. Assess current workforce
3. Forecast future needs
4. Identify gaps
5. Develop plans to address gaps
6. Implement and monitor`,

    "2-1": `Motivation and Leadership

Motivation is what drives employees to perform well and achieve goals.

Maslow's Hierarchy of Needs (bottom to top):
1. Physiological - basic needs (salary, breaks)
2. Safety - job security, safe conditions
3. Social - team belonging, workplace relationships
4. Esteem - recognition, responsibility
5. Self-actualization - reaching potential, creativity

Herzberg's Two-Factor Theory:
Hygiene factors (prevent dissatisfaction):
• Pay and benefits
• Working conditions
• Company policies
• Job security

Motivators (create satisfaction):
• Achievement
• Recognition
• Responsibility
• Advancement

Taylor's Scientific Management:
• Standardized tasks and procedures
• Piece-rate payment systems
• Division of labor
• Close supervision

Leadership Styles:
• Autocratic - leader makes all decisions
• Democratic - employees involved in decisions
• Laissez-faire - minimal direction given
• Situational - style adapted to circumstances`,

    "2-2": `Organizational Structure

Organizational structure defines how activities are coordinated and how authority flows within a business.

Key terms:
• Span of control - number of subordinates a manager oversees
• Chain of command - line of authority from top to bottom
• Hierarchy - levels of management
• Delegation - passing authority to subordinates

Types of organizational structure:

Tall structure:
• Many levels of hierarchy
• Narrow span of control
• Clear career progression
• Can be slow to make decisions

Flat structure:
• Few levels of hierarchy
• Wide span of control
• Greater employee autonomy
• Faster communication

Functional structure - organized by department (marketing, finance, operations)

Divisional structure - organized by product, region, or customer type

Matrix structure - employees report to multiple managers

Factors affecting structure choice:
• Size of organization
• Nature of business
• Management style
• Technology used
• External environment`,

    "2-3": `Recruitment and Selection

Recruitment is the process of attracting suitable candidates for job vacancies.

Internal recruitment:
• Promoting existing employees
• Job posting within organization
• Employee referrals

Advantages: Cost-effective, shorter training time, motivating for staff
Disadvantages: Limited pool, may cause resentment, no new ideas

External recruitment:
• Job advertisements
• Recruitment agencies
• Social media/LinkedIn
• Graduate programs
• Job fairs

Advantages: Fresh perspectives, wider talent pool, new skills
Disadvantages: More expensive, longer process, unknown quantities

Selection Process:
1. Application review (CV/resume)
2. Shortlisting candidates
3. Testing (aptitude, skills, personality)
4. Interviews (individual, panel, group)
5. Reference checks
6. Job offer and negotiation

Legal considerations:
• Equal opportunity - no discrimination
• Data protection - handling applicant information
• Right to work verification
• Contractual obligations`,

    "2-4": `Training and Development

Training improves skills and knowledge for current job, while development prepares employees for future roles.

Types of training:

Induction training:
• Orientation for new employees
• Company policies and procedures
• Health and safety
• Introduction to colleagues

On-the-job training:
• Learning while working
• Job shadowing
• Mentoring and coaching
• Job rotation

Off-the-job training:
• External courses
• Conferences and seminars
• E-learning
• Simulation exercises

Benefits of training:
• Improved productivity
• Better quality work
• Increased motivation
• Reduced staff turnover
• Competitive advantage

Costs of training:
• Direct costs (courses, materials)
• Time away from work
• Risk of trained staff leaving
• Need for ongoing investment

Evaluating training effectiveness:
• Immediate reaction
• Learning achieved
• Behavior change
• Business impact`,

    "2-5": `Workforce Planning

Workforce planning ensures the right people with right skills are available at the right time.

Components of workforce planning:
1. Labor demand forecasting
2. Labor supply analysis
3. Gap analysis
4. Action planning

Factors affecting workforce plans:
• Business growth or decline
• Technological change
• Skills requirements evolution
• Labor market conditions
• Retirement and turnover rates

Workforce audit assesses current employees:
• Skills and qualifications
• Age profile
• Performance levels
• Potential for development

Strategies to address workforce gaps:
• Recruitment (internal/external)
• Training and development
• Outsourcing
• Automation
• Flexible working arrangements

Labor turnover = (Number of leavers / Average workforce) × 100

High turnover costs:
• Recruitment expenses
• Training new staff
• Lost productivity
• Loss of knowledge`,

    "2-6": `Communication in Business

Effective communication is essential for business success.

Types of communication:
• Verbal - face-to-face, phone, meetings
• Written - emails, reports, memos
• Visual - charts, diagrams, videos
• Non-verbal - body language, gestures

Communication channels:
Formal channels:
• Official meetings
• Reports and documents
• Organizational notices

Informal channels:
• Casual conversations
• Social events
• Grapevine

Barriers to effective communication:
• Language differences
• Cultural misunderstandings
• Information overload
• Technical issues
• Physical distance
• Noise and distractions

Communication flow:
• Downward - from management to staff
• Upward - from staff to management
• Horizontal - between same-level colleagues
• Diagonal - across departments and levels

Modern communication technologies:
• Email and instant messaging
• Video conferencing
• Project management tools
• Social networking platforms`,

    "2-7": `Employee Relations

Employee relations covers the relationship between employers, employees, and their representatives.

Industrial democracy - involving employees in decision-making:
• Works councils
• Employee representatives
• Share ownership schemes
• Quality circles

Trade unions:
• Collective bargaining
• Protecting member interests
• Negotiating pay and conditions
• Representing members in disputes

Collective bargaining:
• Process of negotiation between employers and unions
• Covers wages, hours, conditions
• Results in collective agreements

Industrial action:
• Strike - withdrawal of labor
• Work-to-rule - following rules precisely
• Overtime ban
• Go-slow

Conflict resolution:
• Negotiation between parties
• Conciliation - third party facilitates
• Arbitration - third party decides
• Industrial tribunals

Employee engagement:
• Emotional commitment to organization
• Going beyond minimum requirements
• Reduces turnover and absenteeism
• Improves productivity and quality`,

    "3-0": `Marketing Principles

Marketing is the process of identifying, anticipating, and satisfying customer needs profitably.

Key marketing concepts:

Market orientation:
• Focus on customer needs
• Market research drives decisions
• Products designed to meet demand

Product orientation:
• Focus on production efficiency
• Assumes good products sell themselves
• May ignore customer preferences

The marketing process:
1. Market research
2. Marketing strategy development
3. Marketing mix implementation
4. Monitoring and evaluation

Marketing objectives:
• Increase market share
• Build brand awareness
• Launch new products
• Enter new markets
• Improve customer loyalty

Value proposition:
• What makes product unique
• Benefits to customers
• Why choose over competitors

Customer lifetime value:
Total profit from customer relationship over time`,

    "3-1": `Market Research

Market research gathers information to support marketing decisions.

Primary research (field research):
• Questionnaires and surveys
• Interviews
• Focus groups
• Observations
• Test marketing

Advantages: Specific to business needs, current data, proprietary
Disadvantages: Time-consuming, expensive, may have bias

Secondary research (desk research):
• Government statistics
• Industry reports
• Academic research
• Company records
• Media sources

Advantages: Quick, inexpensive, available immediately
Disadvantages: May be outdated, not specific, available to competitors

Qualitative research - explores opinions, attitudes, motivations
• In-depth interviews
• Focus groups
• Open-ended questions

Quantitative research - numerical data and statistics
• Surveys with closed questions
• Statistical analysis
• Large sample sizes

Sampling methods:
• Random - every person has equal chance
• Stratified - divided into segments
• Quota - specific numbers from categories
• Convenience - whoever is available`,

    "3-2": `Marketing Mix: Product

Product is anything offered to satisfy a customer need or want.

Product levels:
• Core product - basic benefit
• Actual product - physical features
• Augmented product - added services

Product life cycle stages:
1. Development - research and design
2. Introduction - launch to market
3. Growth - sales increase rapidly
4. Maturity - sales peak and stabilize
5. Decline - sales decrease

Extension strategies:
• Product modification
• Finding new markets
• New uses for product
• Rebranding/refreshing image

Product portfolio - range of products offered:
• Product line - related products
• Product mix - all products

Boston Matrix:
• Stars - high growth, high share
• Cash cows - low growth, high share
• Question marks - high growth, low share
• Dogs - low growth, low share

Product differentiation:
• Design and features
• Quality
• Branding
• Customer service`,

    "3-3": `Marketing Mix: Price

Price is the amount customers pay for a product or service.

Pricing strategies:

Cost-plus pricing:
• Add percentage markup to cost
• Simple to calculate
• Ensures profit margin

Competitive pricing:
• Match or undercut competitors
• Monitor market prices
• May lead to price wars

Penetration pricing:
• Low price to gain market share
• Used for new products
• Increase price later

Skimming pricing:
• High initial price
• Target early adopters
• Lower price over time

Psychological pricing:
• 9.99 instead of 10
• Creates perception of value
• Premium pricing for luxury

Price elasticity of demand:
• Measures sensitivity to price changes
• Elastic - demand changes significantly
• Inelastic - demand changes little

Factors affecting pricing:
• Costs of production
• Competition
• Market conditions
• Brand positioning
• Customer perceptions`,

    "3-4": `Marketing Mix: Place (Distribution)

Place refers to how products reach customers.

Distribution channels:
Direct: Manufacturer → Customer
• Online sales
• Factory outlets
• Direct sales force

Indirect: Manufacturer → Intermediaries → Customer
• Retailers
• Wholesalers
• Agents

Multi-channel distribution:
• Using several channels simultaneously
• Reaching different customer segments
• Increasing market coverage

E-commerce considerations:
• Website functionality
• Payment security
• Delivery logistics
• Returns handling

Factors affecting channel choice:
• Product characteristics
• Target market preferences
• Cost considerations
• Control requirements
• Geographic coverage

Logistics and supply chain:
• Warehousing
• Inventory management
• Transportation
• Order processing

Retail trends:
• Omnichannel retail
• Click and collect
• Same-day delivery
• Experiential stores`,

    "3-5": `Marketing Mix: Promotion

Promotion communicates product benefits to target customers.

Promotional mix elements:

Advertising:
• TV, radio, print, online
• Reaches large audiences
• Can be expensive
• One-way communication

Sales promotion:
• Discounts and offers
• Competitions
• Free samples
• Loyalty programs

Public relations:
• Press releases
• Sponsorship
• Community involvement
• Crisis management

Personal selling:
• Face-to-face interaction
• Building relationships
• High-value products
• Immediate feedback

Direct marketing:
• Email campaigns
• Direct mail
• Telemarketing
• Targeted messaging

Digital marketing:
• Social media marketing
• Search engine optimization
• Content marketing
• Influencer partnerships

AIDA model:
• Attention - capture interest
• Interest - provide information
• Desire - create want
• Action - encourage purchase`,

    "3-6": `Market Segmentation

Market segmentation divides the market into distinct groups with common characteristics.

Segmentation bases:

Geographic:
• Region/country
• Urban/rural
• Climate

Demographic:
• Age
• Gender
• Income
• Education
• Family size

Psychographic:
• Lifestyle
• Personality
• Values
• Interests

Behavioral:
• Usage rate
• Brand loyalty
• Benefits sought
• Purchase occasion

Benefits of segmentation:
• Better targeting
• Efficient use of resources
• Meeting specific needs
• Competitive advantage

Target market selection:
• Undifferentiated - same marketing for all
• Differentiated - different marketing for segments
• Concentrated - focus on one segment
• Micro-marketing - individual customization

Positioning:
• How product is perceived relative to competitors
• Positioning map/perceptual map
• Unique selling proposition (USP)`,

    "3-7": `Digital Marketing

Digital marketing uses online channels to reach and engage customers.

Key digital marketing channels:

Social media marketing:
• Facebook, Instagram, Twitter, LinkedIn
• Content creation and sharing
• Community building
• Paid advertising

Search engine marketing (SEM):
• Search engine optimization (SEO)
• Pay-per-click advertising
• Keyword strategy

Email marketing:
• Newsletters
• Promotional campaigns
• Automated sequences
• Personalization

Content marketing:
• Blog posts
• Videos
• Infographics
• Podcasts

Mobile marketing:
• App-based marketing
• SMS campaigns
• Location-based marketing

Digital analytics:
• Website traffic analysis
• Conversion tracking
• Customer journey mapping
• ROI measurement

Emerging trends:
• Artificial intelligence
• Voice search optimization
• Video marketing growth
• Personalization at scale`,

    "4-0": `Production Methods

Production is the process of transforming inputs into outputs.

Types of production:

Job production:
• One-off, custom products
• High skilled labor
• High unit cost
• Examples: wedding cakes, custom furniture

Batch production:
• Groups of similar products
• Some economies of scale
• Flexibility between batches
• Examples: bakery goods, clothing lines

Flow production:
• Continuous, high volume
• Standardized products
• Capital intensive
• Examples: cars, electronics

Mass customization:
• Combining mass production with customization
• Flexible manufacturing systems
• Customer specifications
• Examples: Nike ID, Dell computers

Cell production:
• Team-based manufacturing
• Complete product sections
• Multi-skilled workers
• Improved motivation

Factors affecting method choice:
• Nature of product
• Size of market
• Available resources
• Customer expectations
• Technology available`,

    "4-1": `Quality Management

Quality means meeting customer expectations consistently.

Quality control:
• Inspection of finished products
• Detecting defects after production
• May be costly if defects found late

Quality assurance:
• Focus on production process
• Preventing defects
• Setting standards

Total Quality Management (TQM):
• Organization-wide quality culture
• Continuous improvement
• Employee involvement
• Customer focus

Key TQM principles:
• Management commitment
• Customer orientation
• Process approach
• Continuous improvement
• Employee empowerment

Quality standards and certifications:
• ISO 9001 - quality management system
• ISO 14001 - environmental management
• Industry-specific standards

Quality circles:
• Small groups of workers
• Meet regularly
• Identify and solve problems
• Bottom-up improvement

Kaizen - continuous improvement:
• Small, incremental changes
• All employees contribute
• Waste elimination
• Process optimization`,

    "4-2": `Supply Chain Management

Supply chain management coordinates flow of goods, information, and finances.

Supply chain components:
• Suppliers and raw materials
• Manufacturing
• Distribution
• Retail
• End customers

Supplier relationships:
• Supplier selection criteria
• Single vs multiple sourcing
• Partnership vs transactional
• Long-term agreements

Procurement:
• Identifying needs
• Supplier research
• Negotiation
• Contract management
• Order placement

Factors in supplier selection:
• Price and payment terms
• Quality standards
• Reliability and delivery
• Capacity and flexibility
• Location and logistics

Just-in-Time (JIT) supply:
• Minimize inventory
• Receive materials when needed
• Requires reliable suppliers
• Reduces storage costs

Supply chain risks:
• Supplier failure
• Natural disasters
• Political instability
• Transportation disruptions

Supply chain sustainability:
• Ethical sourcing
• Environmental impact
• Fair labor practices
• Local sourcing`,

    "4-3": `Inventory Management

Inventory management ensures adequate stock while minimizing costs.

Types of inventory:
• Raw materials
• Work-in-progress (WIP)
• Finished goods
• Spare parts

Costs of inventory:
• Purchase/ordering costs
• Holding/storage costs
• Stockout costs
• Opportunity cost

Inventory control methods:

Economic Order Quantity (EOQ):
• Balances ordering and holding costs
• Optimal order size
• Assumptions about constant demand

Just-in-Time (JIT):
• Zero inventory goal
• Frequent small deliveries
• Requires reliable suppliers
• Reduces waste and costs

ABC analysis:
• A items - high value, close control
• B items - medium value, regular control
• C items - low value, minimal control

Inventory metrics:
• Stock turnover ratio
• Days of inventory
• Service level
• Fill rate

Technology in inventory:
• Barcode scanning
• RFID tracking
• Inventory management software
• Real-time monitoring`,

    "4-4": `Location Decisions

Business location affects costs, revenues, and competitive position.

Factors affecting location:

Cost factors:
• Land and building costs
• Labor costs and availability
• Transportation costs
• Tax incentives

Revenue factors:
• Proximity to customers
• Market access
• Competition nearby
• Visibility and accessibility

Other factors:
• Infrastructure availability
• Supplier proximity
• Government regulations
• Environmental considerations
• Quality of life

Types of location decisions:
• New business startup
• Expansion/additional site
• Relocation
• Offshoring/outsourcing

Quantitative analysis:
• Break-even location analysis
• Center of gravity method
• Transportation cost analysis

Qualitative factors:
• Community attitude
• Quality of local schools
• Climate and environment
• Personal preferences

Multi-site businesses:
• Distribution network design
• Regional coverage
• Hub and spoke systems`,

    "4-5": `Project Planning

Project planning ensures projects are completed on time, within budget, and to specification.

Project characteristics:
• Specific objectives
• Defined start and end
• Resources allocated
• Cross-functional team

Project planning tools:

Gantt charts:
• Visual timeline
• Task duration bars
• Dependencies shown
• Easy to understand

Network analysis:
• Shows task relationships
• Critical path identification
• Resource optimization

Critical Path Analysis (CPA):
• Identifies longest path
• Determines minimum project time
• Highlights critical activities
• Shows float/slack time

Key project planning steps:
1. Define objectives
2. Identify activities
3. Sequence activities
4. Estimate durations
5. Allocate resources
6. Monitor and control

Project constraints:
• Time - deadlines and schedules
• Cost - budget limitations
• Scope - what's included
• Quality - standards required`,

    "4-6": `Lean Production

Lean production aims to eliminate waste while maintaining quality.

Types of waste (muda):
• Overproduction
• Waiting time
• Transportation
• Over-processing
• Inventory excess
• Unnecessary motion
• Defects

Lean principles:
1. Identify value from customer perspective
2. Map the value stream
3. Create flow
4. Establish pull system
5. Pursue perfection

Key lean techniques:

5S methodology:
• Sort (Seiri)
• Set in order (Seiton)
• Shine (Seiso)
• Standardize (Seiketsu)
• Sustain (Shitsuke)

Kanban:
• Visual signal system
• Pull-based production
• Limits work-in-progress
• Improves flow

Value stream mapping:
• Documents current process
• Identifies waste
• Plans future state

Poka-yoke:
• Mistake-proofing
• Preventing errors
• Simple design solutions

Benefits of lean:
• Reduced costs
• Improved quality
• Faster delivery
• Greater flexibility`,

    "4-7": `Operations Technology

Technology transforms operations management capabilities.

Types of operations technology:

Computer-Aided Design (CAD):
• Digital product design
• 3D modeling
• Rapid prototyping
• Design modification

Computer-Aided Manufacturing (CAM):
• Automated production
• CNC machines
• Robotics
• Precision manufacturing

Enterprise Resource Planning (ERP):
• Integrated business systems
• Real-time data
• Cross-functional coordination
• Single database

Automation and robotics:
• Repetitive task automation
• Consistent quality
• 24/7 operation
• Reduced labor costs

Industry 4.0:
• Internet of Things (IoT)
• Artificial intelligence
• Big data analytics
• Smart factories

3D printing/additive manufacturing:
• Rapid prototyping
• Customization
• Reduced tooling costs
• On-demand production

Benefits of technology:
• Increased productivity
• Improved quality
• Reduced costs
• Greater flexibility
• Better decision-making

Challenges:
• High initial investment
• Training requirements
• Technology obsolescence
• Integration complexity`
  };

  const key = `${unitNum}-${topicIdx}`;
  return contentMap[key] || `Comprehensive content about ${topicName} for AICE Business Unit ${unitNum}.`;
}

// Sample URLs for educational content
const EDUCATIONAL_URLS = [
  "https://www.investopedia.com/terms/e/entrepreneur.asp",
  "https://www.bbc.co.uk/bitesize/subjects/zpsvr82",
  "https://www.tutor2u.net/business",
  "https://corporatefinanceinstitute.com/resources/management/business-structure/",
  "https://www.economicshelp.org/blog/glossary/business-objectives/",
  "https://www.mindtools.com/atqthqp/stakeholder-analysis",
  "https://www.investopedia.com/terms/p/pest-analysis.asp",
  "https://hbr.org/topic/subject/leadership",
];

// Sample YouTube URLs for business topics
const YOUTUBE_URLS = [
  "https://www.youtube.com/watch?v=ZoqgAy3h4OM",
  "https://www.youtube.com/watch?v=ukzFI9rgwfU",
  "https://www.youtube.com/watch?v=IYMSTl5Lv9w",
  "https://www.youtube.com/watch?v=ReM1uqmVfP0",
  "https://www.youtube.com/watch?v=TbFI0VQq4k4",
  "https://www.youtube.com/watch?v=3zl1QzTsmFE",
  "https://www.youtube.com/watch?v=F5vtCRFRAK0",
  "https://www.youtube.com/watch?v=9vJRopau0g0",
];

async function createAICENotebooks() {
  console.log("🎓 Creating AICE Business/Entrepreneurship Test Notebooks\n");
  console.log("=".repeat(60));

  // Get the first user to create notebooks for
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" }
  });

  if (!user) {
    console.error("❌ No user found in database. Please create a user first.");
    return;
  }

  console.log(`Creating notebooks for user: ${user.email}`);

  console.log(`\n📁 Creating AICE Business & Entrepreneurship notebooks...`);

  const createdNotebooks: string[] = [];
  let totalSources = 0;

  for (const unit of AICE_UNITS) {
    console.log(`\n📓 Creating notebook for Unit ${unit.unit}: ${unit.title}`);
    console.log("-".repeat(50));

    // Create notebook
    const notebook = await prisma.notebook.create({
      data: {
        id: crypto.randomUUID(),
        title: `AICE Unit ${unit.unit}: ${unit.title}`,
        description: `Cambridge AICE AS Level Business - Unit ${unit.unit} covering ${unit.topics.join(", ")}`,
        userId: user.id,
        isPublic: false,
      }
    });

    createdNotebooks.push(notebook.id);
    console.log(`   ✅ Created notebook: ${notebook.id}`);

    // Add 8 sources (one for each topic)
    for (let i = 0; i < 8; i++) {
      const topic = unit.topics[i];
      const sourceType = SOURCE_TYPES[i];

      let sourceData: {
        id: string;
        notebookId: string;
        type: typeof SOURCE_TYPES[number];
        title: string;
        content: string | null;
        originalUrl: string | null;
        rawContent: string | null;
        status: string;
        wordCount: number;
        metadata: Record<string, unknown> | null;
      };

      if (sourceType === "TEXT") {
        const textContent = generateTextContent(unit.unit, i, topic);
        sourceData = {
          id: crypto.randomUUID(),
          notebookId: notebook.id,
          type: "TEXT",
          title: `Lesson ${i + 1}: ${topic}`,
          content: textContent,
          rawContent: textContent,
          originalUrl: null,
          status: "COMPLETED",
          wordCount: textContent.split(/\s+/).filter(Boolean).length,
          metadata: { type: "plain_text", topic, unit: unit.unit }
        };
      } else if (sourceType === "URL") {
        const urlIndex = (unit.unit * 2 + i) % EDUCATIONAL_URLS.length;
        sourceData = {
          id: crypto.randomUUID(),
          notebookId: notebook.id,
          type: "URL",
          title: `Web Resource: ${topic}`,
          content: `Educational content about ${topic} from ${EDUCATIONAL_URLS[urlIndex]}. This source provides comprehensive information about ${topic} including definitions, examples, and practical applications in business contexts.`,
          rawContent: null,
          originalUrl: EDUCATIONAL_URLS[urlIndex],
          status: "COMPLETED",
          wordCount: 50,
          metadata: { url: EDUCATIONAL_URLS[urlIndex], topic, scraped: true }
        };
      } else if (sourceType === "YOUTUBE") {
        const ytIndex = (unit.unit + i) % YOUTUBE_URLS.length;
        const videoId = YOUTUBE_URLS[ytIndex].split("v=")[1] || "";
        sourceData = {
          id: crypto.randomUUID(),
          notebookId: notebook.id,
          type: "YOUTUBE",
          title: `Video: ${topic}`,
          content: `[YouTube Video Transcript] This educational video covers ${topic} including key concepts, theories, and real-world business examples. Topics discussed include the fundamental principles, applications in modern business, and case studies demonstrating best practices.`,
          rawContent: null,
          originalUrl: YOUTUBE_URLS[ytIndex],
          status: "COMPLETED",
          wordCount: 45,
          metadata: {
            videoId,
            topic,
            hasTranscript: true,
            duration: 600 + Math.random() * 600
          }
        };
      } else {
        continue;
      }

      await prisma.notebookSource.create({
        data: sourceData as Parameters<typeof prisma.notebookSource.create>[0]["data"]
      });
      totalSources++;
      console.log(`      📄 Added ${sourceType} source: "${sourceData.title}"`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ AICE Business Notebooks Creation Complete!");
  console.log(`   📓 Notebooks created: ${createdNotebooks.length}`);
  console.log(`   📄 Total sources added: ${totalSources}`);
  console.log("\nNotebook IDs:");
  createdNotebooks.forEach((id, i) => {
    console.log(`   ${i + 1}. ${id}`);
  });

  await prisma.$disconnect();
}

createAICENotebooks().catch(console.error);
