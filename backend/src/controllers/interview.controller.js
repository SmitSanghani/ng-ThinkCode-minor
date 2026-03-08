const crypto = require('crypto');
const Interview = require('../models/Interview');
const User = require('../models/user.model');

// @desc    Create a new interview room
// @route   POST /api/interview/create
// @access  Private (Admin only)
exports.createInterview = async (req, res, next) => {
    try {
        const { candidateId } = req.body;

        if (!candidateId) {
            return res.status(400).json({ success: false, message: 'Candidate ID is required' });
        }

        // Verify Candidate exists
        const candidate = await User.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ success: false, message: 'Candidate not found' });
        }

        // Generate a unique roomId (e.g., room_abcdef123)
        const randomString = crypto.randomBytes(4).toString('hex');
        const roomId = `room_${Date.now()}_${randomString}`;

        // Create the interview record
        const interview = await Interview.create({
            roomId,
            interviewerId: req.user.id, // The admin creating it is the interviewer
            candidateId
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        const meetingLink = `${frontendUrl}/interview/${interview.roomId}`;

        const { emitToUser } = require('../socket');
        emitToUser(candidateId, 'receiveMessage', {
            sender: req.user.name || 'Admin',
            senderId: req.user.id,
            text: 'Interview Invitation',
            isInvite: true,
            roomId: interview.roomId,
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            roomId: interview.roomId,
            link: `/interview/${interview.roomId}`
        });
    } catch (error) {
        console.error('Error creating interview:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get interview details by roomId (Validate Room)
// @route   GET /api/interview/:roomId
// @access  Private
exports.getInterviewByRoomId = async (req, res, next) => {
    try {
        const { roomId } = req.params;

        const interview = await Interview.findOne({ roomId })
            .populate('interviewerId', 'name email role')
            .populate('candidateId', 'name email role');

        if (!interview) {
            return res.status(404).json({ success: false, message: 'Interview room not found or invalid link' });
        }

        // Validate that the requester is either the interviewer or the candidate
        const isInterviewer = interview.interviewerId._id.toString() === req.user.id;
        const isCandidate = interview.candidateId._id.toString() === req.user.id;

        if (!isInterviewer && !isCandidate) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You are not a participant in this interview room' });
        }

        res.status(200).json({
            success: true,
            data: interview
        });
    } catch (error) {
        console.error('Error fetching interview:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Execute code using Judge0 API
// @route   POST /api/interview/run
// @access  Private
exports.runCode = async (req, res, next) => {
    try {
        const { code, language } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Code is required' });
        }

        const languageMap = {
            'javascript': 93, // Node.js
            'python': 71,
            'java': 62,
            'cpp': 54
        };

        const languageId = languageMap[language.toLowerCase()] || 93;

        // Note: Replace with proper Judge0 configuration / RapidAPI credentials
        const judge0Url = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com/submissions';

        let response;
        try {
            const axios = require('axios');
            response = await axios.post(judge0Url, {
                source_code: code,
                language_id: languageId,
                stdin: ''
            }, {
                params: { base64_encoded: 'false', wait: 'true' },
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Key': process.env.JUDGE0_API_KEY || 'your-rapidapi-key-here',
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
                }
            });

            res.status(200).json({
                success: true,
                output: response.data.stdout || response.data.message || '',
                compile_error: response.data.compile_output || '',
                status: response.data.status?.description || 'Executed'
            });
        } catch (apiError) {
            console.error('Judge0 API Error:', apiError.response?.data || apiError.message);
            // Dummy fallback if Judge0 is not configured
            res.status(200).json({
                success: true,
                output: 'Mock Output: Execution simulated since Judge0 API Key is missing.',
                compile_error: '',
                status: 'Simulated'
            });
        }
    } catch (error) {
        console.error('Error running code:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

